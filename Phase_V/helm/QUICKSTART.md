# Kubernetes Deployment Quickstart Guide

Complete step-by-step guide to deploy the Phase IV Todo Chatbot application to Minikube using Helm charts.

## Prerequisites

### Required Tools

- **Docker** 20.0+ (with WSL2 integration on Windows)
- **Minikube** 1.28+
- **Helm** 3.12+
- **kubectl** 1.28+

### Verification

```bash
docker --version
minikube version
helm version
kubectl version --client
```

## Step 1: Start Minikube Cluster

```bash
# Start cluster with appropriate resources
minikube start --cpus=2 --memory=3072 --driver=docker

# Verify cluster is running
minikube status

# Expected output:
# minikube
# type: Control Plane
# host: Running
# kubelet: Running
# apiserver: Running
# kubeconfig: Configured
```

## Step 2: Configure Docker Environment

```bash
# Point Docker CLI to Minikube's Docker daemon
eval $(minikube docker-env)

# Verify configuration
docker ps | head -3

# You should see Kubernetes system containers
```

## Step 3: Build Docker Images

### Frontend Image

```bash
# Build frontend (from Phase_IV directory)
docker build -t todo-frontend:phase4 -f Dockerfile.frontend .

# Verify image
docker images | grep todo-frontend

# Expected: todo-frontend   phase4   ...   <500MB
```

**Build time**: ~3-5 minutes (first build), ~30 seconds (cached)

### Backend Image

```bash
# Build backend
docker build -t todo-backend:phase4 -f Dockerfile.backend .

# Verify image
docker images | grep todo-backend

# Expected: todo-backend   phase4   ...   <1GB
```

**Build time**: ~3-5 minutes (first build), ~45 seconds (cached)

## Step 4: Create Kubernetes Secrets

### Prepare Environment Variables

Create a `.env` file with your credentials:

```bash
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:30000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
OPENAI_API_KEY=sk-your-openai-key-here
```

### Create Frontend Secret

```bash
kubectl create secret generic frontend-secrets \
  --from-literal=auth-secret="$BETTER_AUTH_SECRET"

# Verify
kubectl get secret frontend-secrets
```

### Create Backend Secret

```bash
kubectl create secret generic backend-secrets \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=openai-api-key="$OPENAI_API_KEY" \
  --from-literal=auth-secret="$BETTER_AUTH_SECRET" \
  --from-literal=auth-url="$BETTER_AUTH_URL"

# Verify
kubectl get secret backend-secrets
```

**Security Note**: Never commit `.env` files or secrets to Git.

## Step 5: Deploy Helm Charts

### Install Frontend Chart

```bash
# Install
helm install frontend ./helm/frontend

# Expected output:
# NAME: frontend
# LAST DEPLOYED: ...
# STATUS: deployed

# Verify pods
kubectl get pods -l app=frontend

# Expected: 2 pods in Running state within 30-60 seconds
```

### Install Backend Chart

```bash
# Install
helm install backend ./helm/backend

# Expected output:
# NAME: backend
# LAST DEPLOYED: ...
# STATUS: deployed

# Verify pods
kubectl get pods -l app=backend

# Expected: 1 pod in Running state within 45-90 seconds
```

## Step 6: Verify Deployment

### Check All Pods

```bash
kubectl get pods

# Expected output:
# NAME                        READY   STATUS    RESTARTS   AGE
# frontend-xxxxx-yyyyy        1/1     Running   0          1m
# frontend-xxxxx-zzzzz        1/1     Running   0          1m
# backend-xxxxx-yyyyy         1/1     Running   0          45s
```

### Check Services

```bash
kubectl get svc

# Expected output:
# NAME         TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
# frontend     NodePort    10.xxx.xxx.xxx   <none>        3000:30000/TCP   1m
# backend      NodePort    10.xxx.xxx.xxx   <none>        8000:30001/TCP   45s
```

### Check Health Endpoints

```bash
# Frontend health
curl http://localhost:30000/api/health

# Expected: {"status":"ok"} or similar

# Backend health
curl http://localhost:30001/api/health

# Expected: {"status":"healthy","service":"agent-chat","database":"connected"}
```

## Step 7: Access Application

### Frontend UI

Open browser and navigate to:
```
http://localhost:30000
```

You should see the Todo Chatbot dashboard with ChatKit widget.

### Backend API Documentation

Open browser and navigate to:
```
http://localhost:30001/docs
```

You should see the FastAPI Swagger UI.

## Step 8: Test End-to-End Flow

1. **Authenticate**: Login via Better Auth on the frontend
2. **Open Chat**: Click the chat widget in the dashboard
3. **Send Message**: Type "Add a task to buy milk"
4. **Verify Response**: Agent should confirm task creation
5. **Check UI**: Verify the new task appears in the task list

## Troubleshooting

### Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name>

# Check pod logs
kubectl logs <pod-name>

# Common issues:
# - Image not found: Rebuild images with eval $(minikube docker-env)
# - Secret not found: Recreate secrets (Step 4)
# - Resource limits: Increase Minikube memory (minikube delete && minikube start --memory=4096)
```

### Health Checks Failing

```bash
# Port-forward to test locally
kubectl port-forward svc/frontend 3000:3000
curl http://localhost:3000/api/health

# Check application logs
kubectl logs -l app=frontend
kubectl logs -l app=backend
```

### Database Connection Error

```bash
# Verify DATABASE_URL in secret
kubectl get secret backend-secrets -o jsonpath='{.data.database-url}' | base64 -d

# Test connection from backend pod
kubectl exec -it $(kubectl get pod -l app=backend -o name | head -1) -- \
  python -c "from sqlalchemy import create_engine; import os; create_engine(os.getenv('DATABASE_URL')).connect(); print('OK')"
```

### Image Not Found

```bash
# Re-run Docker environment configuration
eval $(minikube docker-env)

# Rebuild images
docker build -t todo-frontend:phase4 -f Dockerfile.frontend .
docker build -t todo-backend:phase4 -f Dockerfile.backend .

# Restart pods to pull new images
kubectl rollout restart deployment frontend
kubectl rollout restart deployment backend
```

## Upgrade Deployment

### Update Image Tag

```bash
# Build new image
docker build -t todo-frontend:v1.1.0 -f Dockerfile.frontend .

# Upgrade Helm release
helm upgrade frontend ./helm/frontend --set image.tag=v1.1.0

# Watch rollout
kubectl rollout status deployment frontend
```

### Update Configuration

```bash
# Edit values.yaml or use --set
helm upgrade frontend ./helm/frontend \
  --set replicaCount=3 \
  --set resources.limits.memory=768Mi
```

## Rollback Deployment

```bash
# View release history
helm history frontend

# Rollback to previous version
helm rollback frontend

# Or rollback to specific revision
helm rollback frontend 2
```

## Cleanup

### Delete Helm Releases

```bash
helm uninstall frontend
helm uninstall backend
```

### Delete Secrets

```bash
kubectl delete secret frontend-secrets backend-secrets
```

### Stop Minikube

```bash
minikube stop
```

### Delete Minikube Cluster

```bash
minikube delete
```

## Next Steps

- **Production Deployment**: Replace NodePort with Ingress or LoadBalancer
- **Monitoring**: Add Prometheus and Grafana for observability
- **Logging**: Centralize logs with ELK stack or Loki
- **Scaling**: Configure Horizontal Pod Autoscaler (HPA)
- **CI/CD**: Automate builds and deployments with GitHub Actions or GitLab CI

## Support

For issues or questions:
- Check Helm chart READMEs: `./helm/frontend/README.md`, `./helm/backend/README.md`
- View Kubernetes events: `kubectl get events --sort-by='.lastTimestamp'`
- Check pod logs: `kubectl logs -l app=<frontend|backend>`
