# Backend Helm Chart

FastAPI + OpenAI Agents SDK for Todo Chatbot - Phase IV Kubernetes Deployment

## Description

This Helm chart deploys the backend FastAPI application with OpenAI Agents SDK and MCP tools for the Todo Chatbot. The chart configures:

- **1 replica** (stateful AI agent operations)
- **NodePort service** on port 30001 for local access
- **Health probes** for liveness and readiness (with database connectivity check)
- **Resource limits** (1000m CPU, 1Gi memory per pod)
- **Environment configuration** via secrets

## Prerequisites

- Kubernetes 1.28+
- Helm 3.12+
- Minikube cluster running (for local development)
- Backend Docker image built: `todo-backend:phase4`
- Kubernetes secret `backend-secrets` created with required keys
- PostgreSQL database accessible from cluster (Neon or local)

## Installation

### 1. Build Backend Image

```bash
# Configure Docker to use Minikube's daemon
eval $(minikube docker-env)

# Build image
docker build -t todo-backend:phase4 -f Dockerfile.backend .
```

### 2. Create Kubernetes Secret

```bash
kubectl create secret generic backend-secrets \
  --from-literal=database-url="postgresql://user:pass@host:5432/db" \
  --from-literal=openai-api-key="sk-..." \
  --from-literal=auth-secret="your-auth-secret" \
  --from-literal=auth-url="http://localhost:30000"
```

### 3. Install Helm Chart

```bash
# Install with default values
helm install backend ./helm/backend

# Or install with custom values
helm install backend ./helm/backend \
  --set replicaCount=1 \
  --set resources.limits.memory=2Gi
```

### 4. Verify Deployment

```bash
# Check pods
kubectl get pods -l app=backend

# Check service
kubectl get svc backend

# Access API docs
# http://localhost:30001/docs
```

## Configuration

### values.yaml Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of backend pod replicas | `1` |
| `image.repository` | Backend image repository | `todo-backend` |
| `image.tag` | Backend image tag | `phase4` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `service.type` | Kubernetes service type | `NodePort` |
| `service.port` | Service port | `8000` |
| `service.nodePort` | NodePort for external access | `30001` |
| `resources.limits.cpu` | CPU limit per pod | `1000m` |
| `resources.limits.memory` | Memory limit per pod | `1Gi` |
| `secret.name` | Kubernetes secret name | `backend-secrets` |

### Environment Variables

All environment variables are sourced from Kubernetes Secret `backend-secrets`:

| Variable | Secret Key | Description |
|----------|------------|-------------|
| `DATABASE_URL` | `database-url` | PostgreSQL connection string |
| `OPENAI_API_KEY` | `openai-api-key` | OpenAI API key for Agents SDK |
| `BETTER_AUTH_SECRET` | `auth-secret` | JWT signing secret (shared with frontend) |
| `BETTER_AUTH_URL` | `auth-url` | Frontend URL for auth redirects |

## Upgrade

```bash
# Upgrade with new image tag
helm upgrade backend ./helm/backend --set image.tag=v1.1.0

# Upgrade with modified values
helm upgrade backend ./helm/backend -f custom-values.yaml
```

## Rollback

```bash
# View release history
helm history backend

# Rollback to previous revision
helm rollback backend

# Rollback to specific revision
helm rollback backend 2
```

## Uninstall

```bash
helm uninstall backend
```

## Troubleshooting

### Pods not starting

```bash
# Check pod status
kubectl describe pod -l app=backend

# Check logs
kubectl logs -l app=backend --tail=100
```

### Database connection failing

```bash
# Check database URL secret
kubectl get secret backend-secrets -o jsonpath='{.data.database-url}' | base64 -d

# Test connection from pod
kubectl exec -it <backend-pod> -- python -c "from sqlalchemy import create_engine; import os; engine = create_engine(os.getenv('DATABASE_URL')); engine.connect(); print('Connected!')"
```

### Health check failing

```bash
# Check health endpoint manually
kubectl port-forward svc/backend 8000:8000
curl http://localhost:8000/api/health
```

### Agent not processing requests

```bash
# Check OpenAI API key
kubectl get secret backend-secrets -o jsonpath='{.data.openai-api-key}' | base64 -d

# Check pod logs for agent errors
kubectl logs -l app=backend | grep -i agent
```

## Support

For issues related to:
- **Helm chart**: Check chart syntax with `helm lint ./helm/backend`
- **Kubernetes deployment**: Check events with `kubectl get events --sort-by='.lastTimestamp'`
- **Application errors**: Check logs with `kubectl logs -l app=backend --tail=100`
- **Database connectivity**: Verify network policies allow pod-to-database traffic
