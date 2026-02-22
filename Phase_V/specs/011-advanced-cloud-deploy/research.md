# Research: Phase V Advanced Cloud-Native AI Deployment

**Feature**: 011-advanced-cloud-deploy
**Date**: 2026-02-21
**Sources**: 4 parallel research agents (Dapr, Kafka, AKS/CI-CD, Recurring Tasks)

---

## 1. EVENT BROKER: KAFKA PLATFORM SELECTION

### Decision: Redpanda (Minikube local) | Aiven (cloud production)

**Rationale**:
- Redpanda eliminates ZooKeeper dependency, uses 40% fewer resources, starts in ~6s vs ~10s for Strimzi — critical for dev iteration on Minikube
- Redpanda is fully Kafka-compatible (protocol, CLI, Dapr component — no config changes between environments)
- Aiven provides predictable flat-rate pricing ($99–150/month) with ALL networking costs included; Confluent charges extra for egress and CKU compute, making it 2–4x more expensive at small scale
- Aiven provides standard Kafka protocol with zero vendor lock-in; 24/7 support included

**Alternatives Considered**:
- Strimzi (Minikube): More complex, requires ZooKeeper, 2.5GB RAM vs 2GB for Redpanda — use if cloud production uses Strimzi pattern for consistency
- Confluent Cloud: Best tooling but unpredictable pricing; overkill for Phase V throughput (<100 events/min)
- Redpanda Cloud: 40–60% cheaper than Confluent for fan-in/fan-out; viable alternative to Aiven

**Minikube Resource Requirements**:
```
minikube start --cpus=4 --memory=4096
Redpanda: CPU 2 cores (shared), Memory 2GB, Storage 10Gi PV
```

**Cloud Connection Pattern (Dapr component)**:
```yaml
- name: brokers
  value: "kafka-xxxxx.a.aivencloud.com:9092"
- name: authType
  value: "password"
- name: saslUsername / saslPassword  # via secretKeyRef
- name: tlsEnabled
  value: "true"
```

---

## 2. KAFKA TOPIC ARCHITECTURE

### Decision: 3 topics, environment-symmetric config, delete retention policy

| Topic | Partitions | Replication (local/cloud) | Retention | Rationale |
|-------|-----------|--------------------------|-----------|-----------|
| `task-events` | 3 | 1 / 3 | 7 days | Events published frequently; 7d needed for debugging + replay |
| `reminders` | 2 | 1 / 3 | 24 hours | One-shot events; minimal archival value |
| `task-updates` | 2 | 1 / 3 | 1 hour | Real-time UI; stale updates are worthless |

**Consumer Group Naming Convention**: `<service>-<domain>-v1`

Examples:
- `recurring-service-task-events-v1` — recurring-service consuming task-events
- `notification-service-reminders-v1` — notification-service consuming reminders
- `notification-service-task-updates-v1` — notification-service consuming task-updates

**Offset Management**: Manual commit only (`enable_auto_commit=False`) after successful processing. Ensures at-least-once delivery without losing events on consumer failure.

**Partition Limit Rule**: `maxReplicas` in HPA/KEDA MUST NOT exceed partition count. 3 partitions on `task-events` → max 3 consumer replicas for recurring-service.

---

## 3. DAPR BUILDING BLOCKS

### 3.1 Pub/Sub (Kafka Abstraction)

**Decision**: Standard Dapr `pubsub.kafka` component v1 for all environments

**Component skeleton (local — no auth)**:
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: pubsub-kafka
spec:
  type: pubsub.kafka
  version: v1
  metadata:
  - name: brokers
    value: "redpanda.kafka.svc.cluster.local:9092"
  - name: authType
    value: "none"
  - name: consumerGroup
    value: "<service>-<domain>-v1"
```

**Cloud override (Aiven — SASL/TLS)**:
```yaml
  - name: brokers
    value: "kafka-xxxxx.a.aivencloud.com:9092"
  - name: authType
    value: "password"
  - name: saslUsername
    secretKeyRef: {name: kafka-credentials, key: username}
  - name: saslPassword
    secretKeyRef: {name: kafka-credentials, key: password}
  - name: tlsEnabled
    value: "true"
```

### 3.2 State Store (PostgreSQL v2)

**Decision**: `state.postgresql` v2 component backed by Neon DB (cloud) or local PostgreSQL

**Key fields**:
- `connectionString`: via `secretKeyRef` to Kubernetes Secret
- `tableName`: `dapr_state` (default)
- `cleanupInterval`: `1h` for TTL-based session data cleanup
- `sslmode`: `require` for cloud; `disable` for local dev

**Note**: Dapr State Store handles session/conversation history. Application data (tasks, users) uses direct SQLModel connection to same or separate PostgreSQL instance.

### 3.3 Jobs API (Recurring Task Scheduling)

**Decision**: Dapr Jobs HTTP API (`/v1.0-alpha1/jobs/{jobName}`) via `httpx` from Python — no native Python SDK support as of v1.14

**Schedule formats**:
- 6-field cron: `"0 0 14 * * 5"` (every Friday 14:00)
- Interval: `"@every 1h"`, `"@daily"`, `"@weekly"`

**Create job**:
```
POST http://localhost:3500/v1.0-alpha1/jobs/{jobName}
{
  "schedule": "0 0 14 * * 5",
  "data": "{\"task_id\": \"uuid\", \"user_id\": \"uid\"}",
  "ttl": "8766h"
}
```

**Callback**: Dapr POSTs to app at `POST /job/{jobName}`. App must expose this route and return 200.

**Constraint**: Jobs API is alpha (v1.0-alpha1) — pin Dapr version and monitor release notes.

### 3.4 Secrets Store (Kubernetes Secrets)

**Decision**: `secretstores.kubernetes` component v1 — no metadata required, auto-discovers secrets in pod namespace

**RBAC required**: ServiceAccount + Role (get/list secrets) + RoleBinding per service

**HTTP retrieval**:
```
GET http://localhost:3500/v1.0/secrets/kubernetes/{secret-name}?key={key-name}
```

**App references secrets via Dapr API** — zero hardcoded values in container images or YAML.

### 3.5 Service Invocation

**Decision**: Dapr HTTP Service Invocation for backend → recurring-service and notification-service health checks; all business logic flows via Kafka events (not direct invocation)

**Pattern**:
```
POST http://localhost:3500/v1.0/invoke/{targetAppId}/method/{path}
```

**Custom resiliency**: 5 retries, exponential backoff 200ms, 2x multiplier, max 60s, circuit breaker on 5 consecutive errors.

### 3.6 Sidecar Injection

**Required annotations** (in `spec.template.metadata.annotations`):
```yaml
dapr.io/enabled: "true"
dapr.io/app-id: "<service-name>"
dapr.io/app-port: "<app-http-port>"
dapr.io/app-protocol: "http"
dapr.io/cpu-request: "100m"
dapr.io/memory-request: "128Mi"
dapr.io/cpu-limit: "500m"
dapr.io/memory-limit: "512Mi"
```

**Dapr internal ports** (not exposed externally):
- `3500`: Dapr HTTP API (app → sidecar)
- `3501`: Dapr gRPC API
- `50001`: Sidecar-to-sidecar internal gRPC

---

## 4. RECURRING TASK LOGIC

### 4.1 RRULE Pattern (RFC 5545)

**Decision**: `python-dateutil.rrule` for RRULE parsing and next-occurrence computation

**Rationale**: python-dateutil is the de-facto Python RFC 5545 implementation; compact string storage in DB; universally understood format

**Storage**: Store full RRULE string in `rrule` text column, e.g.:
```
DTSTART;TZID=America/New_York:20260221T140000
RRULE:FREQ=WEEKLY;BYDAY=FR
```

**Compute next occurrence**:
```python
from dateutil.rrule import rrulestr
from zoneinfo import ZoneInfo
rule = rrulestr(rrule_string)
next_utc = rule.after(datetime.now(ZoneInfo("UTC")))
```

### 4.2 Timezone Handling

**Decision**: `zoneinfo` (Python 3.9+ stdlib) for timezone awareness; store IANA zone name

**Why NOT pytz**: Deprecated behavior, confusing normalization, unfixed DST bugs
**Why NOT offset only**: UTC-5 breaks on DST transitions; IANA zone name auto-adjusts

**Storage rule**: ALWAYS store `timezone_iana` as IANA name (e.g., `"America/New_York"`), NEVER as UTC offset. Store `next_occurrence_at` in UTC.

### 4.3 Dapr Jobs Cron Format

**Decision**: 6-field cron expressions via Dapr Jobs HTTP API

**Field order**: `second minute hour day month day-of-week`
- "Every Friday at 2 PM": `"0 0 14 * * 5"`
- "Every day at 9 AM": `"0 0 9 * * *"`
- "Every hour": `"@every 1h"`

**Job lifecycle**: Create on task creation; delete on task cancellation; update by delete + recreate.

### 4.4 Idempotency for Kafka Consumers

**Decision**: `ProcessedEventLog` table with `UNIQUE(idempotency_key)` constraint

**Idempotency key formula**: `sha256("{user_id}:{task_id}:{scheduled_time_iso}")[:16]`

**Processing flow**:
1. Check `ProcessedEventLog` for existing `idempotency_key` → if found, return cached result
2. Insert row with `status="processing"` (commit) → if unique constraint violated, duplicate detected
3. Execute business logic
4. Update row to `status="processed"`, set `result_id`
5. Consumer commits Kafka offset only after step 4

**TTL cleanup**: `expires_at = processed_at + 30 days`; periodic cleanup job.

---

## 5. KUBERNETES DEPLOYMENT: NGINX INGRESS + TLS

### Decision: NGINX Ingress Controller + cert-manager + Let's Encrypt (AKS)

**Note**: Upstream Kubernetes NGINX Ingress is moving to Gateway API post-2026 (retiring March 2026). For Phase V, NGINX Ingress remains the standard; plan migration in Phase VI.

**Installation order**:
1. `helm install nginx-ingress ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace`
2. `helm install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --set installCRDs=true`
3. Apply `ClusterIssuer` (Let's Encrypt prod + staging)

**ClusterIssuer**:
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ops@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
    - http01:
        ingress:
          class: nginx
```

**Ingress annotation pattern**:
```yaml
annotations:
  cert-manager.io/cluster-issuer: "letsencrypt-prod"
  nginx.ingress.kubernetes.io/ssl-redirect: "true"
```

---

## 6. CI/CD PIPELINE (GITHUB ACTIONS + AKS)

### Decision: GitHub Actions → GHCR → helm upgrade --install on AKS

**Rationale**: GitHub-native; free GHCR for public repos; no separate registry cost; seamless integration with repo secrets

**Pipeline stages**:
1. Matrix build: 4 Docker images (backend, frontend, recurring-service, notification-service) in parallel
2. Push to GHCR with `main-<sha>` tag
3. `helm upgrade --install` for each service with `--set image.tag=main-<sha>` and `--set image.repository=ghcr.io/<owner>/<service>`
4. `kubectl rollout status` verification

**Required GitHub Secrets**:
- `AZURE_CREDENTIALS` — Service principal JSON (Owner role on subscription)
- `REGISTRY_PASSWORD` — GitHub PAT with `write:packages`
- `KUBECONFIG` — AKS kubeconfig (base64 encoded)

**Trigger**: Push to `main` branch, path-filtered to source directories and helm/ charts.

---

## 7. MONITORING & OBSERVABILITY

### Decision: kube-prometheus-stack + prometheus-fastapi-instrumentator + KEDA

**Stack**:
- `kube-prometheus-stack` Helm chart: Prometheus, Grafana, AlertManager, node-exporter, kube-state-metrics
- `prometheus-fastapi-instrumentator`: Expose `/metrics` endpoint in FastAPI (minimal code change)
- `ServiceMonitor` CRD: Declarative scrape config per service (Helm templated)
- KEDA (`kedacore/keda`): Kafka lag-based HPA for recurring-service and notification-service

**FastAPI instrumentation**:
```python
from prometheus_fastapi_instrumentator import Instrumentator
Instrumentator(group_paths=True, skip_paths=["/health"]).instrument(app).expose(app, endpoint="/metrics")
```

**KEDA ScaledObject** (recurring-service):
```yaml
triggers:
- type: kafka
  metadata:
    bootstrapServers: redpanda.kafka.svc.cluster.local:9092
    consumerGroup: recurring-service-task-events-v1
    topic: task-events
    lagThreshold: "500"
    activationLagThreshold: "100"
maxReplicaCount: 3  # Must NOT exceed partition count (3)
```

**Key metrics**:
- `fastapi_requests_total` — Total request count
- `fastapi_request_time_seconds` — Latency histogram (p95 target: <200ms)
- `fastapi_requests_exceptions_total` — Error count
- Grafana Dashboard ID `16110`: FastAPI Observability (pre-built)

---

## 8. RESOURCE LIMITS

### Kubernetes Resource Budget per Service

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit | Min Replicas | Max Replicas |
|---------|-------------|-----------|----------------|--------------|--------------|--------------|
| frontend | 250m | 500m | 256Mi | 512Mi | 2 | 8 |
| backend | 500m | 1000m | 512Mi | 1Gi | 2 | 10 |
| recurring-service | 200m | 500m | 256Mi | 512Mi | 1 | 3 |
| notification-service | 200m | 500m | 256Mi | 512Mi | 1 | 3 |
| dapr sidecar (each) | 100m | 500m | 128Mi | 512Mi | — | — |

**AKS Node Recommendation**: 3× Standard_D2s_v3 (2 vCPU, 8GB RAM) for development; scale to 5-6 nodes for production.

---

## 9. UNRESOLVED ITEMS / PHASE VI CANDIDATES

- NGINX Ingress → Gateway API migration (upstream retiring March 2026)
- Dapr Jobs API graduation from alpha (v1.0-alpha1) — monitor v1.15+ release notes
- Python SDK for Dapr Jobs API — currently only Go, .NET, Java have native SDK support; use HTTP API via `httpx`
- Secret rotation strategy (External Secrets Operator or manual — not in Phase V scope)
- Multi-tenancy topic isolation (all users share topics in Phase V; partition key = `user_id`)
