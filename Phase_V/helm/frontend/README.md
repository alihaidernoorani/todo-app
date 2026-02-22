# Frontend Helm Chart

Next.js ChatKit UI for Todo Chatbot - Phase IV Kubernetes Deployment

## Description

This Helm chart deploys the frontend Next.js application with ChatKit conversational UI for the Todo Chatbot. The chart configures:

- **2 replicas** for high availability
- **NodePort service** on port 30000 for local access
- **Health probes** for liveness and readiness
- **Resource limits** (500m CPU, 512Mi memory per pod)
- **Environment configuration** via values and secrets

## Prerequisites

- Kubernetes 1.28+
- Helm 3.12+
- Minikube cluster running (for local development)
- Frontend Docker image built: `todo-frontend:phase4`
- Kubernetes secret `frontend-secrets` created with `auth-secret` key

## Installation

### 1. Build Frontend Image

```bash
# Configure Docker to use Minikube's daemon
eval $(minikube docker-env)

# Build image
docker build -t todo-frontend:phase4 -f Dockerfile.frontend .
```

### 2. Create Kubernetes Secret

```bash
kubectl create secret generic frontend-secrets \
  --from-literal=auth-secret="your-auth-secret-here"
```

### 3. Install Helm Chart

```bash
# Install with default values
helm install frontend ./helm/frontend

# Or install with custom values
helm install frontend ./helm/frontend \
  --set replicaCount=3 \
  --set env.NEXT_PUBLIC_BACKEND_URL="http://localhost:30001"
```

### 4. Verify Deployment

```bash
# Check pods
kubectl get pods -l app=frontend

# Check service
kubectl get svc frontend

# Access application
# http://localhost:30000
```

## Configuration

### values.yaml Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of frontend pod replicas | `2` |
| `image.repository` | Frontend image repository | `todo-frontend` |
| `image.tag` | Frontend image tag | `phase4` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `service.type` | Kubernetes service type | `NodePort` |
| `service.port` | Service port | `3000` |
| `service.nodePort` | NodePort for external access | `30000` |
| `resources.limits.cpu` | CPU limit per pod | `500m` |
| `resources.limits.memory` | Memory limit per pod | `512Mi` |
| `env.NEXT_PUBLIC_BACKEND_URL` | Backend API URL | `http://localhost:30001` |
| `secret.name` | Kubernetes secret name | `frontend-secrets` |

### Environment Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | ConfigMap (values.yaml) | Backend API base URL |
| `BETTER_AUTH_SECRET` | Secret (frontend-secrets) | JWT signing secret |

## Upgrade

```bash
# Upgrade with new image tag
helm upgrade frontend ./helm/frontend --set image.tag=v1.1.0

# Upgrade with modified values
helm upgrade frontend ./helm/frontend -f custom-values.yaml
```

## Rollback

```bash
# View release history
helm history frontend

# Rollback to previous revision
helm rollback frontend

# Rollback to specific revision
helm rollback frontend 2
```

## Uninstall

```bash
helm uninstall frontend
```

## Troubleshooting

### Pods not starting

```bash
# Check pod status
kubectl describe pod -l app=frontend

# Check logs
kubectl logs -l app=frontend
```

### Health check failing

```bash
# Check health endpoint manually
kubectl port-forward svc/frontend 3000:3000
curl http://localhost:3000/api/health
```

### Image pull error

```bash
# Verify image exists in Minikube
eval $(minikube docker-env)
docker images | grep todo-frontend
```

## Support

For issues related to:
- **Helm chart**: Check chart syntax with `helm lint ./helm/frontend`
- **Kubernetes deployment**: Check events with `kubectl get events --sort-by='.lastTimestamp'`
- **Application errors**: Check logs with `kubectl logs -l app=frontend --tail=100`
