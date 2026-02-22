# Quickstart: Phase V Advanced Cloud-Native AI Deployment

**Feature**: 011-advanced-cloud-deploy
**Date**: 2026-02-21

---

## Prerequisites

| Tool | Minimum Version | Purpose |
|------|-----------------|---------|
| Docker Desktop | 4.x | Container runtime |
| Minikube | 1.32+ | Local Kubernetes cluster |
| kubectl | 1.27+ | Kubernetes CLI |
| Helm | 3.12+ | Kubernetes package manager |
| Dapr CLI | 1.14+ | Dapr sidecar management |
| Python | 3.11+ | Backend and services |
| Node.js | 20+ | Frontend |
| Git | 2.x | Version control |

---

## Local Development Setup (Minikube)

### Step 1: Start Minikube

```bash
# Minimum 4 CPUs and 4GB RAM for all services + Dapr + Kafka
minikube start --cpus=4 --memory=4096 --driver=docker

# Verify
minikube status
kubectl get nodes
```

### Step 2: Install Dapr on Minikube

```bash
# Install Dapr CLI (if not already installed)
# Windows: winget install Dapr.CLI
# macOS: brew install dapr/tap/dapr-cli
# Linux: wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh | /bin/bash

# Initialize Dapr on Kubernetes cluster
dapr init -k

# Verify Dapr pods are running (takes ~2 minutes)
kubectl get pods -n dapr-system
# Expected: dapr-operator, dapr-placement-server, dapr-scheduler-server,
#           dapr-sentry, dapr-sidecar-injector — all Running

# Check Dapr dashboard
dapr dashboard -k
```

### Step 3: Deploy Kafka (Redpanda) on Minikube

```bash
# Add Redpanda Helm repo
helm repo add redpanda https://charts.redpanda.com
helm repo update

# Create namespace
kubectl create namespace kafka

# Install Redpanda (lightweight config for Minikube)
helm install redpanda redpanda/redpanda \
  --namespace kafka \
  --set resources.requests.cpu=null \
  --set resources.requests.memory=null \
  --set resources.limits.cpu="2" \
  --set resources.limits.memory="2Gi" \
  --set storage.persistentVolume.size="10Gi"

# Wait for Redpanda to be ready (~2 minutes)
kubectl wait --for=condition=Ready pod -l app=redpanda -n kafka --timeout=180s

# Verify
kubectl get pods -n kafka
```

### Step 4: Create Kafka Topics

```bash
# Port-forward Redpanda admin API
kubectl port-forward -n kafka svc/redpanda 9092:9092 &

# Create topics (run from local machine)
# Requires rpk CLI or kafka-topics.sh

# Using rpk (Redpanda CLI):
rpk topic create task-events --partitions 3 --replicas 1
rpk topic create reminders --partitions 2 --replicas 1
rpk topic create task-updates --partitions 2 --replicas 1

# Verify
rpk topic list
```

### Step 5: Apply Dapr Components

```bash
# Navigate to Phase_V directory
cd /path/to/Phase_V

# Apply all Dapr component manifests (local config)
kubectl apply -f dapr/components/local/

# Verify components are registered
dapr components -k
# Expected: pubsub-kafka, statestore-postgres, secretstore-kubernetes
```

### Step 6: Create Kubernetes Secrets

```bash
# PostgreSQL connection string (for local dev — use .env values)
kubectl create secret generic postgres-secret \
  --from-literal=connection-string="host=postgres-service user=todo_user password=local_dev_pass port=5432 database=todo_db sslmode=disable"

# OpenAI API key
kubectl create secret generic openai-secret \
  --from-literal=api-key="sk-..."

# Verify
kubectl get secrets
```

### Step 7: Deploy Application Services

```bash
# Build images locally
eval $(minikube docker-env)  # Use Minikube's Docker daemon

# Build all services
docker build -t backend:dev -f Dockerfile.backend .
docker build -t frontend:dev -f Dockerfile.frontend .
docker build -t recurring-service:dev -f services/recurring-service/Dockerfile .
docker build -t notification-service:dev -f services/notification-service/Dockerfile .

# Deploy with Helm (local values)
helm install backend ./helm/backend -f ./helm/backend/values.yaml
helm install frontend ./helm/frontend -f ./helm/frontend/values.yaml
helm install recurring-service ./helm/recurring-service -f ./helm/recurring-service/values.yaml
helm install notification-service ./helm/notification-service -f ./helm/notification-service/values.yaml

# Wait for all pods to be ready
kubectl get pods -w

# Check Dapr sidecar injection
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].name}{"\n"}{end}'
# Each pod should have both app container AND daprd sidecar
```

### Step 8: Verify Local Setup

```bash
# Port-forward backend
kubectl port-forward svc/backend 8000:8000 &

# Health check
curl http://localhost:8000/health
# Expected: {"status": "healthy"}

# Port-forward frontend
kubectl port-forward svc/frontend 3000:3000 &

# Open browser: http://localhost:3000

# Check Dapr pub/sub (publish test event)
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test-jwt>" \
  -d '{"title": "Test task", "priority": "High"}'
```

---

## Running Database Migrations

```bash
# Run Alembic migrations inside backend pod
kubectl exec -it deployment/backend -- alembic upgrade head

# Or run locally with DB port-forwarded
kubectl port-forward svc/postgres-service 5432:5432 &
alembic upgrade head
```

---

## Cloud Deployment (AKS)

### Prerequisites

```bash
# Azure CLI
az login
az account set --subscription <SUBSCRIPTION_ID>

# Create AKS cluster (first time only)
az group create --name todo-rg --location eastus

az aks create \
  --resource-group todo-rg \
  --name todo-aks \
  --node-count 3 \
  --vm-set-type VirtualMachineScaleSets \
  --zones 1 2 3 \
  --enable-managed-identity

az aks get-credentials --resource-group todo-rg --name todo-aks
```

### Install Infrastructure (AKS — first time only)

```bash
# 1. Dapr
dapr init -k --wait

# 2. NGINX Ingress
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.service.type=LoadBalancer \
  --set controller.replicaCount=2

# Get external IP (wait until assigned)
kubectl get svc -n ingress-nginx

# 3. cert-manager
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set installCRDs=true

# Apply ClusterIssuer (after updating email)
kubectl apply -f k8s/cluster-issuer.yaml

# 4. KEDA
helm repo add kedacore https://kedacore.github.io/charts
helm install keda kedacore/keda --namespace keda --create-namespace

# 5. kube-prometheus-stack
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  -f helm/monitoring/values.yaml
```

### Deploy Application (AKS)

```bash
# Create secrets (AKS)
kubectl create secret generic postgres-secret \
  --from-literal=connection-string="host=<neon-db-host> user=<user> password=<pass> port=5432 database=todo_db sslmode=require"

kubectl create secret generic openai-secret \
  --from-literal=api-key="sk-..."

kubectl create secret generic kafka-credentials \
  --from-literal=username="avnadmin" \
  --from-literal=password="<aiven-api-key>"

# Apply Dapr components (cloud config — references cloud Kafka/Neon)
kubectl apply -f dapr/components/cloud/

# Deploy services with AKS values
helm upgrade --install backend ./helm/backend -f ./helm/backend/values-aks.yaml
helm upgrade --install frontend ./helm/frontend -f ./helm/frontend/values-aks.yaml
helm upgrade --install recurring-service ./helm/recurring-service -f ./helm/recurring-service/values-aks.yaml
helm upgrade --install notification-service ./helm/notification-service -f ./helm/notification-service/values-aks.yaml
```

---

## Switching Between Environments

The key difference is the Dapr component YAML files and Helm values overrides:

| Config | Local (Minikube) | Cloud (AKS) |
|--------|-----------------|-------------|
| Kafka broker | `redpanda.kafka.svc.cluster.local:9092` | `kafka-xxxxx.a.aivencloud.com:9092` |
| Auth type | `none` | `password` (SASL) |
| TLS | disabled | enabled |
| State store SSL | `sslmode=disable` | `sslmode=require` |
| Helm values file | `values.yaml` | `values-aks.yaml` |
| Dapr components dir | `dapr/components/local/` | `dapr/components/cloud/` |
| Image registry | Local Docker | `ghcr.io/<owner>/` |
| Ingress | None (port-forward) | NGINX + TLS |

---

## Useful Debugging Commands

```bash
# View Dapr sidecar logs for backend
kubectl logs deployment/backend -c daprd --tail=100 -f

# View app logs
kubectl logs deployment/backend -c backend --tail=100 -f

# Check Dapr components
dapr components -k

# List Dapr jobs (recurring tasks)
curl http://localhost:3500/v1.0-alpha1/jobs

# Check Kafka consumer group lag (Redpanda)
rpk group describe recurring-service-task-events-v1

# Check Prometheus metrics
kubectl port-forward -n monitoring svc/prometheus-stack-grafana 3001:80 &
# Open http://localhost:3001 (admin / <configured-password>)

# Run Dapr dashboard
dapr dashboard -k -p 8080
# Open http://localhost:8080
```

---

## Environment Variables Reference

All environment variables are injected via Kubernetes Secrets and Dapr Secrets API.
**Never hardcode values in source code or Helm values files.**

| Variable | Source | Used By | Description |
|----------|--------|---------|-------------|
| `OPENAI_API_KEY` | K8s Secret `openai-secret` | backend | OpenAI Agents SDK |
| `DATABASE_URL` | K8s Secret `postgres-secret` | backend | Direct SQLModel connection |
| `DAPR_HTTP_PORT` | Dapr sidecar | all services | Dapr API port (default 3500) |
| `DAPR_GRPC_PORT` | Dapr sidecar | all services | Dapr gRPC port (default 50001) |
| `APP_PORT` | Helm values | all services | App listening port |
| `KAFKA_BROKERS` | Dapr component (not env) | all services | Resolved by Dapr PubSub |

---

## CI/CD Pipeline Overview

On push to `main`:
1. GitHub Actions triggers `.github/workflows/deploy-aks.yml`
2. Matrix build: 4 Docker images built in parallel
3. Images pushed to GHCR: `ghcr.io/<owner>/<service>:main-<sha>`
4. Helm upgrade for each service with new image tag
5. `kubectl rollout status` confirms rollout success

Required GitHub Secrets: `AZURE_CREDENTIALS`, `REGISTRY_PASSWORD`, `KUBECONFIG`

---

## GitHub Secrets Required

Configure these secrets in **GitHub → Repository → Settings → Secrets and variables → Actions**:

| Secret Name | How to Obtain | Description |
|-------------|---------------|-------------|
| `REGISTRY_PASSWORD` | GitHub PAT with `write:packages` scope — create at Settings → Developer settings → Personal access tokens | Authenticates Docker push to `ghcr.io`. `REGISTRY_USERNAME` is `${{ github.actor }}` — no separate secret needed. |
| `KUBECONFIG` | `az aks get-credentials --resource-group todo-rg --name todo-aks --file /tmp/kubeconfig && base64 -w0 /tmp/kubeconfig` | Base64-encoded AKS kubeconfig. The workflow decodes this to configure kubectl. |
| `AZURE_CREDENTIALS` | `az ad sp create-for-rbac --name "todo-github-actions" --role Contributor --scopes /subscriptions/<id>/resourceGroups/todo-rg --sdk-auth` | Service principal JSON for Azure login (used if you extend the workflow to use `azure/login` action). |

### Setting Secrets via CLI

```bash
# Install GitHub CLI if needed
# brew install gh  or  winget install GitHub.cli

gh auth login

# Set each secret from a file or literal value
gh secret set REGISTRY_PASSWORD --body "ghp_..."
gh secret set KUBECONFIG < /tmp/kubeconfig.b64
gh secret set AZURE_CREDENTIALS < /tmp/sp-credentials.json
```

---

## Secret Scanning

This repository uses [gitleaks](https://github.com/gitleaks/gitleaks) to prevent secrets from being committed.

The `.gitleaks.toml` configuration at the repo root defines scanning rules. **Any PR with a detected secret will be blocked** from merging.

### Running Gitleaks Locally

```bash
# Install gitleaks
# macOS: brew install gitleaks
# Linux: https://github.com/gitleaks/gitleaks/releases
# Windows: scoop install gitleaks

# Scan staged changes before commit
gitleaks protect --staged

# Scan entire repo history
gitleaks detect --source .

# Scan a specific branch
gitleaks detect --source . --log-opts "main..HEAD"
```

### Files That Must Never Be Committed

- `.env`, `.env.*` — environment variables
- `*-secret.yaml`, `*.secret.yaml` — Kubernetes secrets with real values
- `*.key`, `*.pem`, `*.p12` — private keys and certificates
- `kubeconfig*` — cluster credentials

All these patterns are covered by `.gitignore` — verify with `git status` before committing.
