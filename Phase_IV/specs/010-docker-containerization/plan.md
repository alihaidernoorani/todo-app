# Implementation Plan: Helm Charts & Kubernetes Deployment Strategy

**Feature**: Docker Containerization + Kubernetes Orchestration
**Branch**: `010-docker-containerization`
**Created**: 2026-02-16
**Status**: In Progress

---

## Technical Context

### Problem Statement
The Phase III Todo Chatbot application (Next.js frontend + FastAPI backend with OpenAI Agents SDK) currently runs as local processes. To achieve production-grade deployment with scalability, high availability, and infrastructure-as-code best practices, we need to:

1. **Containerize** both frontend and backend applications using Docker
2. **Package** the containerized applications as Helm charts for Kubernetes
3. **Deploy** to a local Minikube cluster with proper service exposure
4. **Orchestrate** using AI-assisted tools (kubectl-ai, Kagent) for deployment and monitoring
5. **Implement** rollback strategies for failed deployments

### Current State
- ✅ Phase III Todo Chatbot fully functional (local development mode)
- ✅ Frontend: Next.js 16 App Router with ChatKit conversational UI
- ✅ Backend: FastAPI with OpenAI Agents SDK, MCP tools, SQLModel ORM
- ✅ Database: Neon PostgreSQL (cloud-hosted, accessible remotely)
- ✅ Authentication: Better Auth with JWT token validation
- ✅ All Phase III features working: chat-based task management, conversation persistence, user-scoped data isolation

### Target State
- ✅ Frontend and backend containerized with optimized Docker images
- ✅ Helm charts for both services with templated Kubernetes manifests
- ✅ Kubernetes Deployments with configurable replicas (frontend: 2, backend: 1)
- ✅ NodePort Services for local access (frontend: 30000, backend: 30001)
- ✅ ConfigMaps for non-sensitive configuration
- ✅ Secrets for database credentials, API keys, auth secrets
- ✅ Health probes (liveness, readiness) for both services
- ✅ AI-assisted deployment using kubectl-ai
- ✅ Cluster monitoring and optimization using Kagent
- ✅ Rollback capability via Helm history

### Key Technologies
- **Containerization**: Docker 20+ with multi-stage builds
- **Base Images**: `node:20-alpine` (frontend), `python:3.13-slim` (backend)
- **Orchestration**: Kubernetes 1.28+ (Minikube local cluster)
- **Package Manager**: Helm 3.12+
- **AI DevOps**: kubectl-ai (deployment), Kagent (monitoring/optimization)
- **Service Exposure**: NodePort (local development)
- **Configuration**: Kubernetes ConfigMaps & Secrets

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Minikube Cluster                         │
│                                                             │
│  ┌──────────────────────┐      ┌──────────────────────┐   │
│  │  Frontend Deployment │      │  Backend Deployment  │   │
│  │  (2 replicas)        │      │  (1 replica)         │   │
│  │                      │      │                      │   │
│  │  ┌──────────────┐   │      │  ┌──────────────┐   │   │
│  │  │ Next.js Pod  │   │      │  │ FastAPI Pod  │   │   │
│  │  │ Port: 3000   │   │      │  │ Port: 8000   │   │   │
│  │  │ Image:       │   │      │  │ Image:       │   │   │
│  │  │ todo-frontend│   │      │  │ todo-backend │   │   │
│  │  │ :phase4      │   │      │  │ :phase4      │   │   │
│  │  └──────────────┘   │      │  └──────────────┘   │   │
│  │  ┌──────────────┐   │      │                      │   │
│  │  │ Next.js Pod  │   │      │  ConfigMap:          │   │
│  │  │ (replica 2)  │   │      │  - BACKEND_URL       │   │
│  │  └──────────────┘   │      │                      │   │
│  │                      │      │  Secret:             │   │
│  │  ConfigMap:          │      │  - DATABASE_URL      │   │
│  │  - BACKEND_URL       │      │  - OPENAI_API_KEY    │   │
│  │                      │      │  - AUTH_SECRET       │   │
│  │  Secret:             │      │                      │   │
│  │  - AUTH_SECRET       │      │                      │   │
│  └──────────────────────┘      └──────────────────────┘   │
│           │                              │                 │
│           ▼                              ▼                 │
│  ┌──────────────────────┐      ┌──────────────────────┐   │
│  │  Frontend Service    │      │  Backend Service     │   │
│  │  Type: NodePort      │      │  Type: NodePort      │   │
│  │  Port: 3000          │      │  Port: 8000          │   │
│  │  NodePort: 30000     │      │  NodePort: 30001     │   │
│  └──────────────────────┘      └──────────────────────┘   │
│           │                              │                 │
└───────────┼──────────────────────────────┼─────────────────┘
            │                              │
            ▼                              ▼
   http://localhost:30000        http://localhost:30001
   (ChatKit UI)                  (FastAPI /docs)
                                        │
                                        ▼
                              ┌──────────────────┐
                              │  Neon PostgreSQL │
                              │  (External DB)   │
                              └──────────────────┘
```

### Unknowns / Clarifications Needed
- ✅ **Minikube resource allocation**: Minimum CPU/memory requirements for stable operation → Research recommended settings
- ✅ **Image registry strategy**: Use Minikube's built-in registry or external registry? → Research best practice for local development
- ✅ **Secrets management**: How to securely inject secrets into Minikube without committing them? → Research kubectl create secret workflow
- ✅ **kubectl-ai capabilities**: What commands are supported for Helm chart deployment? → Research kubectl-ai documentation
- ✅ **Kagent integration**: How to analyze and optimize Minikube clusters specifically? → Research Kagent local cluster support
- ✅ **Rollback mechanics**: Helm rollback vs kubectl rollout undo - which to use? → Research best practice

---

## Constitution Check

### Alignment with Core Principles

#### ✅ I. Multi-Tier Isolation
**Status**: PASS
**Verification**:
- Dockerfiles reside at repository root: `Dockerfile.frontend`, `Dockerfile.backend`
- Helm charts organized under `/helm/frontend/` and `/helm/backend/`
- Kubernetes manifests templated within Helm chart `templates/` directories
- No cross-contamination between frontend, backend, and deployment artifacts
- Deployment configurations reference application code via container images, not direct file access

#### ✅ II. Persistence First
**Status**: PASS
**Verification**:
- Backend container connects to external Neon PostgreSQL (not containerized database)
- All conversation state, task data, and user information persist to database
- Containers are stateless - can be destroyed and recreated without data loss
- Database connection string provided via Kubernetes Secret (environment variable injection)
- No in-memory state; conversation history reconstructed from database on each request

#### ✅ III. Secure by Design
**Status**: PASS
**Verification**:
- Dockerfiles use non-root users (`nextjs`, `fastapi`) for security
- Kubernetes Secrets store sensitive data (database URL, API keys, auth secrets)
- ConfigMaps store non-sensitive configuration (backend URL, feature flags)
- Better Auth JWT validation continues to work in containerized environment
- All API requests authenticated via JWT tokens (no change from Phase III)
- User-scoped data isolation enforced at database query level (preserved from Phase III)

#### ✅ IV. Zero Manual Coding
**Status**: PASS
**Verification**:
- All Dockerfiles generated by Claude Code (optionally enhanced with Gordon AI)
- All Helm charts, templates, and values files generated by Claude Code
- All Kubernetes manifests templated via Helm (not manually written YAML)
- kubectl-ai and Kagent operations executed through Claude Code prompts
- No manual kubectl commands required (AI-assisted operations preferred)

#### ✅ V. Test-First Discipline
**Status**: ADVISORY
**Verification**:
- Container build tests: Verify images build successfully without errors
- Container runtime tests: Verify containers start and pass health checks
- Integration tests: Verify end-to-end user flow in Kubernetes environment
- Helm chart validation: `helm lint` and `helm install --dry-run` before deployment
- Rollback tests: Simulate failed deployment and verify rollback restores previous state
**Note**: Tests should be defined before implementation where possible

#### ✅ VI. API Contract Enforcement
**Status**: PASS
**Verification**:
- REST API contracts unchanged from Phase III (FastAPI endpoints)
- MCP tool contracts unchanged from Phase III (agent tool definitions)
- Kubernetes Services expose the same ports (3000, 8000) via NodePort
- Frontend-backend communication uses environment variable (`NEXT_PUBLIC_BACKEND_URL`)
- No breaking changes to API contracts during containerization

#### ✅ XIV. Container-First Deployment
**Status**: PASS (Core Requirement)
**Verification**:
- Multi-stage Dockerfiles for both frontend and backend
- Official minimal base images: `node:20-alpine`, `python:3.13-slim`
- Non-root users configured in all containers
- Health checks defined in Dockerfiles
- Environment variables for all configuration (no hardcoded values)
- `.dockerignore` files exclude unnecessary build context

#### ✅ XV. Kubernetes-Native Orchestration
**Status**: PASS (Core Requirement)
**Verification**:
- Separate Kubernetes Deployments for frontend and backend
- Replica counts configurable (frontend: 2, backend: 1)
- Services exposed via NodePort for local access
- Resource limits defined (CPU, memory)
- Liveness and readiness probes configured
- ConfigMaps and Secrets for configuration management
- Rolling update strategy for zero-downtime deployments

#### ✅ XVI. Helm-Based Package Management
**Status**: PASS (Core Requirement)
**Verification**:
- Helm charts in `/helm/frontend/` and `/helm/backend/`
- Standard chart structure: `Chart.yaml`, `values.yaml`, `templates/`, `README.md`
- Templated Kubernetes manifests (Deployment, Service, ConfigMap)
- Values parameterized for environment-specific overrides
- Semantic versioning for charts (1.0.0)
- `helm install`, `helm upgrade`, `helm rollback` supported

#### ✅ XVII. AI-Assisted DevOps Operations
**Status**: PASS (Core Requirement)
**Verification**:
- kubectl-ai used for deployment commands (natural language)
- Kagent used for cluster health analysis and optimization
- Manual kubectl commands discouraged (AI tools preferred)
- All AI operations logged in PHRs for traceability

### Complexity Tracking

| Violation Type | Justification | Mitigation |
|----------------|---------------|------------|
| None | All principles satisfied | N/A |

**Notes**:
- This feature is Phase IV's core deliverable and aligns perfectly with all Phase IV principles (XIV-XVII)
- No Phase I-III principles are violated; containerization preserves all existing functionality
- Test-first discipline is advisory (SHOULD) rather than mandatory (MUST) per constitution

---

## Phase 0: Research & Discovery

### Research Tasks

#### 1. Minikube Resource Requirements
**Question**: What are the recommended CPU/memory allocations for Minikube to run 3 pods (2 frontend + 1 backend) with Phase III chatbot workload?

**Research Approach**:
- Review Minikube official documentation for resource allocation
- Check Kubernetes pod resource limits best practices
- Consider Phase III application requirements (Next.js build, FastAPI with AI agent)

**Expected Findings**:
- Minimum Minikube resources: 4 CPU cores, 8GB RAM
- Frontend pod limits: 500m CPU, 512Mi memory
- Backend pod limits: 1000m CPU, 1Gi memory (higher due to AI agent)
- Total cluster overhead: ~2GB for Kubernetes system pods

**Decision Impact**: Determines `values.yaml` resource limits and Minikube setup instructions

---

#### 2. Image Registry Strategy
**Question**: Should we use Minikube's built-in registry, Docker Hub, or build images directly in Minikube's Docker daemon?

**Research Approach**:
- Compare Minikube registry options: `minikube image load`, `minikube image build`, registry addon
- Evaluate pros/cons for local development workflow
- Check Phase IV constitution requirements for image management

**Expected Findings**:
- **Option A**: `minikube image build` - builds directly in Minikube's Docker daemon (simplest for local dev)
- **Option B**: Build locally + `minikube image load` - uses local Docker, then transfers image
- **Option C**: Enable Minikube registry addon - full registry simulation (most production-like)

**Decision Impact**: Determines build workflow in tasks.md and deployment instructions

---

#### 3. Secrets Management for Local Development
**Question**: How to securely inject database URL, OpenAI API key, and Better Auth secret into Minikube without committing them to Git?

**Research Approach**:
- Review Kubernetes Secrets best practices
- Check `kubectl create secret` syntax for generic secrets
- Explore `.env` file integration with `--from-env-file`

**Expected Findings**:
- Use `kubectl create secret generic` with `--from-literal` for individual values
- Or `kubectl create secret generic --from-env-file=.env` for bulk import
- Secrets must be created BEFORE Helm chart installation
- Helm charts reference existing secrets (not create them with hardcoded values)

**Decision Impact**: Determines Secret template in Helm charts and deployment workflow

---

#### 4. kubectl-ai Capabilities for Helm
**Question**: What kubectl-ai commands are supported for Helm chart installation, upgrade, and rollback?

**Research Approach**:
- Review kubectl-ai documentation or GitHub README
- Test natural language commands for Helm operations
- Identify supported vs unsupported operations

**Expected Findings**:
- Supported: "install helm chart", "upgrade deployment", "show pods", "get logs"
- Unsupported: Complex Helm-specific operations (may require manual `helm` commands)
- Fallback: Use standard `helm` commands if kubectl-ai doesn't support operation

**Decision Impact**: Determines which operations use kubectl-ai vs manual Helm CLI

---

#### 5. Kagent Local Cluster Support
**Question**: Can Kagent analyze and optimize local Minikube clusters, or is it designed for cloud-based clusters only?

**Research Approach**:
- Review Kagent documentation for cluster compatibility
- Check if Kagent supports single-node clusters (Minikube)
- Identify relevant Kagent commands for local development

**Expected Findings**:
- Kagent works with any Kubernetes cluster (including Minikube)
- Useful commands: `kagent analyze cluster`, `kagent optimize resources`, `kagent diagnose performance`
- May provide limited recommendations for single-node clusters vs production multi-node

**Decision Impact**: Determines Kagent usage strategy and which commands to document

---

#### 6. Rollback Strategy: Helm vs Kubectl
**Question**: Should we use `helm rollback` or `kubectl rollout undo` for failed deployments?

**Research Approach**:
- Compare Helm rollback (restores entire release) vs kubectl rollout undo (per-deployment)
- Check best practices for Kubernetes deployment rollbacks
- Consider Phase IV constitution requirements

**Expected Findings**:
- **Helm rollback**: Restores entire release (all resources) to previous revision - safer for multi-resource changes
- **kubectl rollout undo**: Rolls back individual Deployment only - faster but may miss ConfigMap/Secret changes
- Best practice: Use Helm rollback for releases, kubectl rollout undo for quick Deployment fixes

**Decision Impact**: Determines rollback procedure in deployment workflow

---

### Research Consolidation

All research findings will be documented in `research.md` with the following structure:

```markdown
# Research Findings: Kubernetes Deployment Strategy

## 1. Minikube Resource Allocation
**Decision**: Allocate 4 CPU cores, 8GB RAM to Minikube
**Rationale**: Supports 2 frontend pods (500m CPU, 512Mi each) + 1 backend pod (1000m CPU, 1Gi) + Kubernetes system overhead (~2GB)
**Alternatives Considered**: 2 CPU/4GB (insufficient for AI workload), 8 CPU/16GB (overkill for local dev)

## 2. Image Registry Strategy
**Decision**: Use `minikube image build` to build images directly in Minikube's Docker daemon
**Rationale**: Simplest workflow for local development, no image transfer overhead, no external registry needed
**Alternatives Considered**: Local build + `minikube image load` (slower), registry addon (complex setup)

## 3. Secrets Management
**Decision**: Create Secrets via `kubectl create secret generic --from-literal` before Helm install
**Rationale**: Keeps secrets out of Helm charts and Git, supports per-environment configuration
**Alternatives Considered**: Helm chart creates secrets with hardcoded values (insecure), external secret management tools (overkill for local dev)

## 4. kubectl-ai Usage
**Decision**: Use kubectl-ai for deployment, monitoring, and troubleshooting; fallback to `helm` CLI for chart-specific operations
**Rationale**: kubectl-ai excels at natural language queries and pod management, but Helm CLI is more reliable for chart lifecycle
**Alternatives Considered**: All kubectl-ai (may not support complex Helm operations), all manual Helm (defeats AI-assisted DevOps principle)

## 5. Kagent Integration
**Decision**: Use Kagent for cluster analysis and resource optimization after deployment
**Rationale**: Provides actionable recommendations for resource limits, identifies bottlenecks, validates deployment health
**Alternatives Considered**: Manual `kubectl top` and metrics analysis (less intelligent), skip optimization (misses opportunities)

## 6. Rollback Strategy
**Decision**: Primary: `helm rollback <release> <revision>`, Secondary: `kubectl rollout undo deployment/<name>`
**Rationale**: Helm rollback restores entire release state (safer), kubectl rollout undo for quick Deployment fixes
**Alternatives Considered**: Always use kubectl (loses Helm's atomic rollback), no rollback strategy (unsafe)
```

---

## Phase 1: Design & Contracts

### 1.1 Helm Chart Structure Design

#### Frontend Helm Chart (`/helm/frontend/`)

**Chart.yaml**:
```yaml
apiVersion: v2
name: frontend
description: Next.js ChatKit UI for Todo Chatbot
type: application
version: 1.0.0
appVersion: "phase4"
```

**values.yaml**:
```yaml
replicaCount: 2

image:
  repository: todo-frontend
  pullPolicy: IfNotPresent
  tag: "phase4"

service:
  type: NodePort
  port: 3000
  targetPort: 3000
  nodePort: 30000

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

env:
  NEXT_PUBLIC_BACKEND_URL: "http://localhost:30001"

secret:
  name: frontend-secrets
  # Created externally via kubectl

livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

**templates/deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Chart.Name }}
  labels:
    app: {{ .Chart.Name }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Chart.Name }}
  template:
    metadata:
      labels:
        app: {{ .Chart.Name }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - containerPort: {{ .Values.service.targetPort }}
        env:
        - name: NEXT_PUBLIC_BACKEND_URL
          value: "{{ .Values.env.NEXT_PUBLIC_BACKEND_URL }}"
        - name: BETTER_AUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: {{ .Values.secret.name }}
              key: auth-secret
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
        livenessProbe:
          {{- toYaml .Values.livenessProbe | nindent 10 }}
        readinessProbe:
          {{- toYaml .Values.readinessProbe | nindent 10 }}
```

**templates/service.yaml**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Chart.Name }}
  labels:
    app: {{ .Chart.Name }}
spec:
  type: {{ .Values.service.type }}
  ports:
  - port: {{ .Values.service.port }}
    targetPort: {{ .Values.service.targetPort }}
    nodePort: {{ .Values.service.nodePort }}
  selector:
    app: {{ .Chart.Name }}
```

---

#### Backend Helm Chart (`/helm/backend/`)

**Chart.yaml**:
```yaml
apiVersion: v2
name: backend
description: FastAPI + OpenAI Agents SDK for Todo Chatbot
type: application
version: 1.0.0
appVersion: "phase4"
```

**values.yaml**:
```yaml
replicaCount: 1

image:
  repository: todo-backend
  pullPolicy: IfNotPresent
  tag: "phase4"

service:
  type: NodePort
  port: 8000
  targetPort: 8000
  nodePort: 30001

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 500m
    memory: 512Mi

secret:
  name: backend-secrets
  # Created externally via kubectl
  # Keys: database-url, openai-api-key, auth-secret, auth-url

livenessProbe:
  httpGet:
    path: /api/health
    port: 8000
  initialDelaySeconds: 15
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 5
```

**templates/deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Chart.Name }}
  labels:
    app: {{ .Chart.Name }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Chart.Name }}
  template:
    metadata:
      labels:
        app: {{ .Chart.Name }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - containerPort: {{ .Values.service.targetPort }}
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: {{ .Values.secret.name }}
              key: database-url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: {{ .Values.secret.name }}
              key: openai-api-key
        - name: BETTER_AUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: {{ .Values.secret.name }}
              key: auth-secret
        - name: BETTER_AUTH_URL
          valueFrom:
            secretKeyRef:
              name: {{ .Values.secret.name }}
              key: auth-url
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
        livenessProbe:
          {{- toYaml .Values.livenessProbe | nindent 10 }}
        readinessProbe:
          {{- toYaml .Values.readinessProbe | nindent 10 }}
```

**templates/service.yaml**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Chart.Name }}
  labels:
    app: {{ .Chart.Name }}
spec:
  type: {{ .Values.service.type }}
  ports:
  - port: {{ .Values.service.port }}
    targetPort: {{ .Values.service.targetPort }}
    nodePort: {{ .Values.service.nodePort }}
  selector:
    app: {{ .Chart.Name }}
```

---

### 1.2 Dockerfile Design

#### Frontend Dockerfile (`Dockerfile.frontend`)

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy package files
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY frontend/ .

# Build Next.js application
RUN pnpm build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "server.js"]
```

---

#### Backend Dockerfile (`Dockerfile.backend`)

```dockerfile
# Stage 1: Dependencies
FROM python:3.13-slim AS deps
WORKDIR /app

# Install uv for fast dependency management
RUN pip install --no-cache-dir uv

# Copy dependency files
COPY backend/pyproject.toml backend/uv.lock* ./

# Install dependencies
RUN uv sync --no-dev

# Stage 2: Production
FROM python:3.13-slim AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 fastapi && \
    adduser --system --uid 1001 fastapi

# Copy dependencies from deps stage
COPY --from=deps --chown=fastapi:fastapi /app/.venv /app/.venv

# Copy application code
COPY --chown=fastapi:fastapi backend/ .

USER fastapi

EXPOSE 8000

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')"

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### 1.3 Deployment Workflow Design

#### Prerequisites
1. Minikube running: `minikube start --cpus=4 --memory=8192`
2. Docker images built (using Minikube's Docker daemon)
3. Kubernetes Secrets created

#### Step 1: Build Container Images
```bash
# Configure shell to use Minikube's Docker daemon
eval $(minikube docker-env)

# Build frontend image
docker build -t todo-frontend:phase4 -f Dockerfile.frontend .

# Build backend image
docker build -t todo-backend:phase4 -f Dockerfile.backend .

# Verify images
docker images | grep todo
```

#### Step 2: Create Kubernetes Secrets
```bash
# Frontend secrets
kubectl create secret generic frontend-secrets \
  --from-literal=auth-secret="$BETTER_AUTH_SECRET"

# Backend secrets
kubectl create secret generic backend-secrets \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=openai-api-key="$OPENAI_API_KEY" \
  --from-literal=auth-secret="$BETTER_AUTH_SECRET" \
  --from-literal=auth-url="$BETTER_AUTH_URL"
```

#### Step 3: Deploy Helm Charts (via kubectl-ai)
```bash
# Install frontend chart
kubectl-ai "install the frontend helm chart from ./helm/frontend with release name frontend"

# Install backend chart
kubectl-ai "install the backend helm chart from ./helm/backend with release name backend"

# Verify deployment
kubectl-ai "show all pods and their status"
kubectl-ai "show all services and their nodeport URLs"
```

#### Step 4: Access Application
```bash
# Get Minikube IP (if not localhost)
minikube ip

# Access frontend
# http://localhost:30000 (or http://<minikube-ip>:30000)

# Access backend API docs
# http://localhost:30001/docs (or http://<minikube-ip>:30001/docs)
```

#### Step 5: Monitor with Kagent
```bash
# Analyze cluster health
kagent analyze cluster

# Optimize resources
kagent optimize resources --namespace default

# Diagnose performance
kagent diagnose performance --deployment backend
```

---

### 1.4 Rollback Strategy Design

#### Scenario 1: Failed Deployment (Pod CrashLoopBackOff)
```bash
# Check pod status
kubectl-ai "why is the backend pod crashing?"

# View logs
kubectl-ai "show logs for the failed backend pod"

# Rollback to previous Helm release
helm rollback backend

# Verify rollback
kubectl-ai "show pod status for backend"
```

#### Scenario 2: Bad Configuration Update
```bash
# Upgraded backend with incorrect environment variable
helm upgrade backend ./helm/backend --set env.SOME_VAR=bad_value

# Pods fail health checks
kubectl-ai "show backend pod health status"

# Rollback to previous revision
helm rollback backend

# Verify rollback restored working configuration
kubectl get configmap backend-config -o yaml
```

#### Scenario 3: Image Version Rollback
```bash
# Upgraded to buggy image version
helm upgrade backend ./helm/backend --set image.tag=buggy-version

# Application errors detected
kubectl-ai "show backend error logs"

# Rollback to previous release (restores old image tag)
helm rollback backend

# Verify correct image is running
kubectl describe pod -l app=backend | grep Image
```

#### Rollback Best Practices
1. **Always test upgrades in dry-run mode first**:
   ```bash
   helm upgrade backend ./helm/backend --dry-run --debug
   ```

2. **List release history before rollback**:
   ```bash
   helm history backend
   ```

3. **Rollback to specific revision if needed**:
   ```bash
   helm rollback backend 2  # Rollback to revision 2
   ```

4. **Verify rollback success**:
   ```bash
   kubectl-ai "confirm all pods are healthy and running"
   ```

5. **Document rollback reason in ADR** if it reveals architectural issue

---

### 1.5 AI-Assisted Operations Reference

#### kubectl-ai Command Patterns

**Deployment**:
```bash
kubectl-ai "deploy the frontend helm chart"
kubectl-ai "install backend chart with 2 replicas"
kubectl-ai "upgrade the backend deployment to use new image tag"
```

**Monitoring**:
```bash
kubectl-ai "show all pods in default namespace"
kubectl-ai "show pod status and resource usage"
kubectl-ai "get the nodeport URLs for all services"
kubectl-ai "describe the backend deployment"
```

**Troubleshooting**:
```bash
kubectl-ai "why is the frontend pod not ready?"
kubectl-ai "show error logs from the backend pod"
kubectl-ai "which pods are using the most memory?"
kubectl-ai "show recent events in the default namespace"
```

**Scaling**:
```bash
kubectl-ai "scale the frontend deployment to 3 replicas"
kubectl-ai "scale backend down to 1 replica"
```

#### Kagent Command Patterns

**Cluster Analysis**:
```bash
kagent analyze cluster
kagent analyze cluster --format json
```

**Resource Optimization**:
```bash
kagent optimize resources --namespace default
kagent optimize resources --deployment backend --apply
```

**Performance Diagnostics**:
```bash
kagent diagnose performance --namespace default
kagent diagnose performance --deployment backend
```

**Security Scanning**:
```bash
kagent security-scan --namespace default
kagent security-scan --deployment frontend
```

**Cost Analysis** (if applicable to local dev):
```bash
kagent cost-analysis --namespace default
```

---

## Architecture Decision Records

### ADR-001: Use Minikube for Local Kubernetes Development

**Status**: Accepted
**Date**: 2026-02-16

**Context**:
We need a local Kubernetes environment to develop and test Helm charts before deploying to cloud-based clusters. Options include Minikube, kind (Kubernetes in Docker), k3s, and Docker Desktop Kubernetes.

**Decision**:
Use Minikube as the local Kubernetes cluster for Phase IV development.

**Rationale**:
- **Industry standard**: Minikube is the official Kubernetes local development tool
- **Feature completeness**: Supports NodePort, LoadBalancer (via tunnel), and Ingress addons
- **Resource efficiency**: Runs as a single VM with configurable CPU/memory
- **kubectl-ai compatibility**: Well-tested with kubectl-ai and Kagent
- **Documentation**: Extensive documentation and community support
- **Cross-platform**: Works on Linux, macOS, Windows (WSL2)

**Alternatives Considered**:
- **kind** (Kubernetes in Docker): Faster startup, but less feature-complete for NodePort access
- **k3s**: Lightweight, but less familiar to Kubernetes practitioners
- **Docker Desktop Kubernetes**: Convenient, but consumes more resources and less configurable

**Consequences**:
- Developers must install Minikube and a hypervisor (or use Docker driver)
- Cluster startup takes ~1-2 minutes (slower than kind)
- Minikube-specific commands required (`minikube start`, `minikube ip`, `minikube tunnel`)
- All deployment instructions and PHRs reference Minikube commands

---

### ADR-002: Use Helm Charts Instead of Raw Kubernetes Manifests

**Status**: Accepted
**Date**: 2026-02-16

**Context**:
Kubernetes resources can be managed via raw YAML manifests or packaged as Helm charts. This decision affects deployment workflow, configuration management, and rollback capabilities.

**Decision**:
Use Helm charts as the primary packaging and deployment mechanism for all Kubernetes resources.

**Rationale**:
- **Templating**: Helm enables parameterized manifests (replicas, image tags, resources) via `values.yaml`
- **Versioning**: Charts are versioned independently from application code
- **Rollback**: `helm rollback` provides atomic rollback of entire releases
- **Reusability**: Charts can be shared, published, and reused across environments
- **Best practice**: Industry standard for Kubernetes package management
- **Constitution alignment**: Aligns with Phase IV Principle XVI (Helm-Based Package Management)

**Alternatives Considered**:
- **Raw YAML manifests**: Simpler for small deployments, but lacks templating and versioning
- **Kustomize**: Good for overlays, but less feature-rich than Helm for complex deployments
- **Custom deployment scripts**: Flexible, but reinvents the wheel and lacks standardization

**Consequences**:
- Developers must learn Helm chart structure and templating syntax
- Helm CLI must be installed on all development machines
- Deployment workflow includes `helm install`, `helm upgrade`, `helm rollback`
- Chart versioning must be maintained separately from application versioning
- All Kubernetes resources must be templated (more upfront work, long-term flexibility)

---

### ADR-003: NodePort for Local Service Exposure

**Status**: Accepted
**Date**: 2026-02-16

**Context**:
Kubernetes services can be exposed via ClusterIP (internal only), NodePort (accessible on node IP), LoadBalancer (cloud provider), or Ingress (HTTP routing). For local Minikube development, we need to choose the appropriate service type.

**Decision**:
Use NodePort service type for both frontend (port 30000) and backend (port 30001) in local Minikube deployments.

**Rationale**:
- **Simplicity**: NodePort exposes services on predictable ports without additional configuration
- **Minikube compatibility**: Works out-of-the-box with Minikube (no tunnel or addons required)
- **Direct access**: Users can access services via `http://localhost:30000` (or Minikube IP)
- **No external dependencies**: LoadBalancer requires cloud provider or `minikube tunnel`
- **Debugging**: Easy to test services directly without Ingress complexity

**Alternatives Considered**:
- **LoadBalancer + minikube tunnel**: More production-like, but requires running `minikube tunnel` in background
- **Ingress**: Best for HTTP routing, but adds complexity for simple local development
- **ClusterIP**: Internal-only, would require `kubectl port-forward` for access

**Consequences**:
- Services accessible on high-numbered ports (30000, 30001) instead of standard ports (80, 443)
- URLs in documentation reference NodePort ports (e.g., `http://localhost:30000`)
- Frontend must be configured with backend URL using NodePort (e.g., `http://localhost:30001`)
- Not production-ready (production deployments should use Ingress or LoadBalancer)
- Port conflicts possible if 30000/30001 are in use (can be overridden in `values.yaml`)

---

### ADR-004: External Secrets via kubectl create secret

**Status**: Accepted
**Date**: 2026-02-16

**Context**:
Sensitive data (database URLs, API keys, auth secrets) must be injected into containers without committing them to Git. Options include Helm-managed secrets, external secret managers (Vault, AWS Secrets Manager), or pre-created Kubernetes Secrets.

**Decision**:
Create Kubernetes Secrets manually via `kubectl create secret` before Helm chart installation. Helm charts reference existing secrets but do not create them.

**Rationale**:
- **Security**: Secrets never committed to Git (not in Helm charts or values files)
- **Simplicity**: No external secret management tools required for local development
- **Flexibility**: Developers can source secrets from `.env` files or environment variables
- **Constitution alignment**: Aligns with Phase IV security requirements (non-root users, no hardcoded secrets)
- **Production path**: Same pattern works with external secret managers (create Secret, reference in Helm)

**Alternatives Considered**:
- **Helm-created secrets**: Secrets defined in `values.yaml` - insecure (committed to Git)
- **External secret managers**: HashiCorp Vault, AWS Secrets Manager - overkill for local dev
- **Sealed Secrets**: Encrypted secrets in Git - adds complexity and tooling requirements

**Consequences**:
- Developers must run `kubectl create secret` commands before `helm install`
- Secrets must be recreated if cluster is destroyed (`minikube delete`)
- Deployment instructions must document secret creation steps
- Helm charts include Secret references but not Secret definitions
- Secret names must match between `kubectl create` and Helm chart templates

---

## Data Model

**No new database entities required.**

This feature focuses on containerization and orchestration. All database schemas remain unchanged from Phase III:
- `users` (Better Auth)
- `tasks` (user-scoped task data)
- `conversations` (chat conversation metadata)
- `messages` (conversation message history)
- `agent_runs` (agent execution logs)
- `tool_calls` (MCP tool invocation logs)

**Environment Configuration Entities**:

| Variable | Scope | Type | Description |
|----------|-------|------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | Frontend | ConfigMap | Backend API base URL (e.g., `http://localhost:30001`) |
| `BETTER_AUTH_SECRET` | Both | Secret | JWT signing secret (shared between frontend and backend) |
| `DATABASE_URL` | Backend | Secret | PostgreSQL connection string (Neon) |
| `OPENAI_API_KEY` | Backend | Secret | OpenAI API key for Agents SDK |
| `BETTER_AUTH_URL` | Backend | Secret | Frontend URL for Better Auth redirects |

---

## API Contracts

**No new API endpoints required.**

All REST API endpoints and MCP tool contracts remain unchanged from Phase III. The containerization layer is transparent to the application logic.

**Service Contracts (Kubernetes)**:

| Service | Type | Port | NodePort | Selector | Health Check |
|---------|------|------|----------|----------|--------------|
| `frontend` | NodePort | 3000 | 30000 | `app: frontend` | `GET /api/health` → 200 OK |
| `backend` | NodePort | 8000 | 30001 | `app: backend` | `GET /api/health` → 200 OK |

**Inter-Service Communication**:
- Frontend → Backend: HTTP requests to `NEXT_PUBLIC_BACKEND_URL` (configured as `http://localhost:30001` for local dev)
- Backend → Database: Direct PostgreSQL connection via `DATABASE_URL` (external Neon cloud)

---

## Deployment Quickstart

### Prerequisites
```bash
# Install tools
brew install minikube helm kubectl kubectl-ai kagent  # macOS
# or use apt/chocolatey for Linux/Windows

# Start Minikube
minikube start --cpus=4 --memory=8192

# Verify Kubernetes cluster
kubectl cluster-info
```

### Build Images
```bash
# Use Minikube's Docker daemon
eval $(minikube docker-env)

# Build images
docker build -t todo-frontend:phase4 -f Dockerfile.frontend .
docker build -t todo-backend:phase4 -f Dockerfile.backend .
```

### Create Secrets
```bash
# Load environment variables
source .env

# Create secrets
kubectl create secret generic frontend-secrets \
  --from-literal=auth-secret="$BETTER_AUTH_SECRET"

kubectl create secret generic backend-secrets \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=openai-api-key="$OPENAI_API_KEY" \
  --from-literal=auth-secret="$BETTER_AUTH_SECRET" \
  --from-literal=auth-url="$BETTER_AUTH_URL"
```

### Deploy Charts
```bash
# Install charts
helm install frontend ./helm/frontend
helm install backend ./helm/backend

# Verify deployment
kubectl get pods,svc
```

### Access Application
```bash
# Frontend: http://localhost:30000
# Backend: http://localhost:30001/docs
```

### Monitor & Optimize
```bash
# Analyze cluster
kagent analyze cluster

# View logs
kubectl-ai "show backend pod logs"
```

### Rollback (if needed)
```bash
# View release history
helm history backend

# Rollback to previous revision
helm rollback backend

# Or rollback to specific revision
helm rollback backend 2
```

---

## Success Criteria Validation

| ID | Criteria | Validation Method |
|----|----------|-------------------|
| SC-001 | Frontend image builds in <5 min, <500MB | `time docker build -f Dockerfile.frontend .` + `docker images` |
| SC-002 | Backend image builds in <5 min, <1GB | `time docker build -f Dockerfile.backend .` + `docker images` |
| SC-003 | Frontend container ready in <10s | `time docker run --env-file .env.local -p 3000:3000 todo-frontend:phase4` |
| SC-004 | Backend container ready in <15s | `time docker run --env-file .env -p 8000:8000 todo-backend:phase4` + `curl http://localhost:8000/api/health` |
| SC-005 | Frontend UI loads in <15s | Navigate to `http://localhost:30000` and measure time to interactive |
| SC-006 | Backend API docs load in <20s | Navigate to `http://localhost:30001/docs` and measure time to render |
| SC-007 | End-to-end flow completes in <10s | Login → chat → send "add task to buy milk" → verify task created |
| SC-008 | Data persists across container restarts | Create task → `kubectl delete pod <backend-pod>` → verify task still exists |
| SC-009 | Cross-platform compatibility | Test on Linux, macOS, Windows WSL2 |
| SC-010 | Health checks respond in <1s | `time curl http://localhost:30000/api/health` and `http://localhost:30001/api/health` |
| SC-011 | Logs provide actionable debugging info | `kubectl logs <pod>` shows startup progress, errors, and request logs |
| SC-012 | Runs with 2GB available RAM | Monitor `docker stats` or `kubectl top pods` during operation |

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Minikube resource exhaustion (pods evicted) | Medium | High | Document minimum 4 CPU/8GB RAM requirement, test on constrained machines |
| Docker image too large (slow builds/deploys) | Medium | Medium | Implement multi-stage builds, use Alpine base images, aggressive `.dockerignore` |
| Secrets accidentally committed to Git | Low | Critical | Add `.env` to `.gitignore`, document secret creation workflow, use pre-commit hooks |
| kubectl-ai doesn't support Helm operations | Medium | Low | Fallback to manual `helm` commands, document both approaches |
| Kagent incompatible with Minikube | Low | Low | Test Kagent on Minikube first, document limitations, fallback to manual monitoring |
| Health checks fail intermittently | Medium | Medium | Increase `initialDelaySeconds` and `periodSeconds`, add retry logic to health endpoints |
| NodePort port conflicts | Low | Low | Document how to override NodePort values in `values.yaml` |
| Database unreachable from containers | Medium | High | Test database connectivity from containers before deployment, document firewall/network config |
| Frontend can't reach backend via NodePort | Medium | High | Test inter-service communication, document backend URL configuration |
| Helm rollback doesn't restore working state | Low | High | Test rollback workflow thoroughly, document rollback procedure, maintain release history |

---

## Next Steps

1. **Phase 2**: Generate actionable tasks via `/sp.tasks`
2. **Phase 3**: Implement Dockerfiles, Helm charts, and deployment workflow via `/sp.implement`
3. **Phase 4**: Validate all success criteria and document deployment in README
4. **Phase 5**: Create PHR documenting this planning phase
5. **Phase 6**: Consider ADRs for any additional architectural decisions discovered during implementation

---

**Plan Status**: Ready for Task Generation
**Next Command**: `/sp.tasks`
