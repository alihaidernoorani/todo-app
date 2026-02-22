# Deployment Validation Checklist

**Feature**: `010-docker-containerization`
**Version**: 1.0.0
**Validated On**: 2026-02-17 (WSL2 / Minikube)

Run this checklist after a fresh deployment to confirm the application is production-ready.

---

## 1. Build & Image Criteria

| ID | Criterion | Command | Expected | Status |
|----|-----------|---------|----------|--------|
| SC-001 | Frontend image <500MB | `docker images todo-frontend:1.0.0` | <500MB | ✅ 210MB |
| SC-002 | Backend image <1GB | `docker images todo-backend:1.0.0` | <1GB | ✅ 252MB |

---

## 2. Container Runtime Criteria

| ID | Criterion | How to Verify | Expected | Status |
|----|-----------|---------------|----------|--------|
| SC-003 | Frontend starts <10s | `kubectl rollout status deployment frontend` | Ready | ✅ ~8s |
| SC-004 | Backend starts, DB connected <15s | `kubectl logs -l app=backend \| grep health` | 200 OK | ✅ ~12s |
| SC-005 | Frontend accessible | `curl http://localhost:3000/api/health` | 200 OK | ✅ |
| SC-006 | Backend docs accessible | `curl http://localhost:8000/docs` | HTML | ✅ |

---

## 3. Kubernetes Deployment Criteria

| Criterion | Command | Expected | Status |
|-----------|---------|----------|--------|
| Minikube cluster starts | `minikube status` | Running | ✅ |
| Frontend Helm installs | `helm install frontend ./helm/frontend` | deployed | ✅ |
| Backend Helm installs | `helm install backend ./helm/backend` | deployed | ✅ |
| Pods reach Running <2min | `kubectl get pods` | Running | ✅ frontend×2, backend×1 |
| NodePort services exposed | `kubectl get svc` | 30000, 30001 | ✅ |
| Database connectivity | `kubectl logs -l app=backend` | no DB errors | ✅ |
| Secrets mounted | `kubectl exec <pod> -- env \| grep AUTH` | values present | ✅ |
| Liveness probes pass | `kubectl get pods` | 0 restarts | ✅ |
| Readiness probes pass | `kubectl get pods` | 1/1 Ready | ✅ |

---

## 4. Integration & End-to-End Criteria

| ID | Criterion | Status |
|----|-----------|--------|
| SC-007 | Auth → chat → task creation <10s | ✅ Verified |
| SC-008 | Pod restart without data loss | ✅ Verified (T070-T071) |
| SC-009 | Runs on Windows WSL2 | ✅ Verified |
| SC-010 | Health checks respond <1s | ✅ Verified |
| SC-011 | Logs provide debugging info | ✅ Verified |
| SC-012 | Stable with 2GB RAM | ✅ Verified |

---

## 5. Security Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| Non-root container users | ✅ | `nextjs` (UID 1001) / `fastapi` (UID 1001) |
| JWT RS256 signature verification | ✅ | JWKS via Kubernetes DNS |
| User-scoped task isolation | ✅ | 401 on missing auth, 403 on user mismatch |
| Secrets via Kubernetes Secret | ✅ | No credentials in image |
| CSP headers enforced | ✅ | Updated for K8s service URLs |

---

## 6. Rollback Criteria

| Criterion | Command | Status |
|-----------|---------|--------|
| Helm history available | `helm history frontend` | ✅ |
| Config rollback works | `helm rollback backend` | ✅ Verified (T087) |
| Image rollback works | `helm rollback frontend` | ✅ Verified (T089) |
| Bad image causes ImagePullBackOff | `--set image.tag=bad` | ✅ Verified (T088) |

---

## 7. Known Limitations & Deferred Items

| Item | Reason | Action |
|------|--------|--------|
| T091-T092: kubectl-ai / Kagent docs | Tools not available in current environment | Defer to future sprint |
| T073-T084: AI-assisted operations | kubectl-ai / Kagent not installed | Defer to future sprint |
| NodePort direct access | WSL2 networking prevents direct NodePort access | Use `kubectl port-forward` |
| NEXT_PUBLIC vars baked at build time | Next.js requirement | Document in QUICKSTART.md |

---

## 8. Quick Validation Commands

```bash
# 1. Cluster state
kubectl get pods,svc

# 2. Backend health (from within pod)
kubectl exec -l app=backend -- curl -s http://127.0.0.1:8000/api/health

# 3. JWKS reachable from backend
kubectl exec -l app=backend -- curl -s http://frontend:3000/api/auth/jwks | python3 -m json.tool

# 4. Frontend health
kubectl exec -l app=frontend -- node -e "require('http').get('http://localhost:3000/api/health', r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>console.log(d)) })"

# 5. Helm release status
helm list
```
