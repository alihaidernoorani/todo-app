# Quickstart: Backend-Frontend Alignment Setup

**Feature**: 005-backend-frontend-alignment
**Last Updated**: 2026-02-05

## Overview

This guide helps you configure backend-frontend integration to resolve 422 and 401 errors. Follow these steps in order.

---

## Prerequisites

- Backend: Python 3.13+, FastAPI, SQLModel
- Frontend: Next.js 16+, Better Auth configured
- Database: Neon PostgreSQL connection string
- Tools: curl or Postman for testing

---

## Step 1: Backend Environment Setup

### 1.1 Configure Environment Variables

Create or update `backend/.env`:

```bash
# Database
NEON_DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# CORS Origins (comma-separated, no spaces recommended)
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app

# Better Auth URL (must match frontend URL)
BETTER_AUTH_URL=http://localhost:3000

# Server Config
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

**Important Notes**:
- `ALLOWED_ORIGINS`: Add ALL frontend URLs (local + production + staging)
- `BETTER_AUTH_URL`: Must match where Better Auth is running (usually frontend URL)
- No trailing slashes on URLs
- Use commas without spaces for multiple origins

### 1.2 Verify Environment Loading

```bash
cd backend
python -c "from src.config import get_settings; s = get_settings(); print(f'Origins: {s.allowed_origins}\nJWKS: {s.better_auth_jwks_url}')"
```

**Expected Output**:
```
Origins: ['http://localhost:3000', 'https://your-app.vercel.app']
JWKS: http://localhost:3000/.well-known/jwks.json
```

---

## Step 2: Frontend Environment Setup

### 2.1 Configure Frontend .env.local

Create or update `frontend/.env.local`:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth Config
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-32-character-random-string-here
BETTER_AUTH_ISSUER=http://localhost:3000
BETTER_AUTH_AUDIENCE=http://localhost:8000

# Database (if Better Auth uses same DB)
NEON_DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

**Generate Random Secret**:
```bash
openssl rand -base64 32
```

---

## Step 3: Test CORS Configuration

### 3.1 Start Both Services

**Terminal 1 (Backend)**:
```bash
cd backend
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 (Frontend)**:
```bash
cd frontend
npm run dev
```

### 3.2 Test Preflight Request (OPTIONS)

```bash
curl -X OPTIONS http://localhost:8000/api/test-user-id/tasks \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v
```

**Expected Response Headers**:
```
HTTP/1.1 200 OK
access-control-allow-origin: http://localhost:3000
access-control-allow-credentials: true
access-control-allow-methods: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD
access-control-allow-headers: Content-Type, Authorization, ...
```

✅ **Success**: Response includes CORS headers
❌ **Failure**: No CORS headers → check `ALLOWED_ORIGINS` in backend/.env

### 3.3 Test Unauthorized Origin

```bash
curl -X OPTIONS http://localhost:8000/api/test-user-id/tasks \
  -H "Origin: https://malicious-site.com" \
  -v
```

**Expected**: No `access-control-allow-origin` header (browser will block).

---

## Step 4: Test JWT Authentication

### 4.1 Verify JWKS Endpoint

```bash
curl http://localhost:3000/.well-known/jwks.json
```

**Expected Output** (JSON with public keys):
```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "...",
      "use": "sig",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

❌ **If 404**: Better Auth not configured correctly or `BETTER_AUTH_URL` wrong.

### 4.2 Get JWT Token

1. Open frontend: http://localhost:3000
2. Sign up or log in via Better Auth
3. Open browser DevTools → Application → Cookies → Copy `better-auth.session_token`
4. Decode at https://jwt.io to inspect claims

**Expected JWT Payload**:
```json
{
  "sub": "user-uuid-here",
  "iss": "http://localhost:3000",
  "aud": "http://localhost:8000",
  "exp": 1738800000,
  "iat": 1738796400
}
```

✅ Check: `sub` claim contains user ID (not empty).

### 4.3 Test Authenticated Request

```bash
curl -X GET http://localhost:8000/api/USER_ID_HERE/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -v
```

Replace:
- `USER_ID_HERE`: Copy from JWT `sub` claim
- `YOUR_JWT_TOKEN_HERE`: JWT token from Better Auth

**Expected**: 200 OK with task list (even if empty: `{"items": [], "count": 0}`)

**Common Errors**:
- **401 "Missing authentication token"**: No Authorization header sent
- **401 "Token expired"**: JWT exp claim is in the past (get new token)
- **401 "Invalid token signature"**: JWKS mismatch (verify BETTER_AUTH_URL)
- **403 "Access denied"**: User ID in URL doesn't match JWT sub claim

---

## Step 5: Test Schema Validation

### 5.1 Valid Task Creation

```bash
curl -X POST http://localhost:8000/api/USER_ID_HERE/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "This is a test",
    "priority": "High"
  }'
```

**Expected**: 201 Created with task object.

### 5.2 Invalid Priority (422 Error)

```bash
curl -X POST http://localhost:8000/api/USER_ID_HERE/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "priority": "Urgent"
  }'
```

**Expected**: 422 Unprocessable Entity
```json
{
  "detail": [
    {
      "loc": ["body", "priority"],
      "msg": "Input should be 'High', 'Medium' or 'Low'",
      "type": "enum"
    }
  ]
}
```

### 5.3 Missing Required Field (422 Error)

```bash
curl -X POST http://localhost:8000/api/USER_ID_HERE/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "No title provided"
  }'
```

**Expected**: 422 with error for missing `title` field.

---

## Step 6: Browser Testing

### 6.1 Test from Frontend UI

1. Open http://localhost:3000
2. Log in with Better Auth
3. Open DevTools → Network tab
4. Create a task via UI
5. Check Network tab for API request

**Verify**:
- ✅ Request has `Authorization: Bearer ...` header
- ✅ Response status 201 Created
- ✅ No CORS errors in Console

### 6.2 Check Console for Errors

**Good**:
```
✅ Task created successfully
```

**Bad (CORS)**:
```
❌ CORS policy: No 'Access-Control-Allow-Origin' header
→ Fix: Add frontend URL to ALLOWED_ORIGINS in backend/.env
```

**Bad (Auth)**:
```
❌ 401 Unauthorized
→ Fix: Verify JWT token is being sent in Authorization header
→ Check: BETTER_AUTH_URL matches frontend URL
```

---

## Step 7: Production Deployment

### 7.1 Backend (Railway/Render/AWS)

**Environment Variables**:
```bash
NEON_DATABASE_URL=postgresql://...
ALLOWED_ORIGINS=https://your-app.vercel.app
BETTER_AUTH_URL=https://your-app.vercel.app
```

**Deployment Checklist**:
- [ ] Set all environment variables
- [ ] Restart service
- [ ] Test JWKS: `curl https://your-app.vercel.app/.well-known/jwks.json`
- [ ] Test health: `curl https://your-backend.com/health`

### 7.2 Frontend (Vercel)

**Environment Variables**:
```bash
NEXT_PUBLIC_API_URL=https://your-backend.com
BETTER_AUTH_URL=https://your-app.vercel.app
BETTER_AUTH_SECRET=<production-secret>
BETTER_AUTH_ISSUER=https://your-app.vercel.app
BETTER_AUTH_AUDIENCE=https://your-backend.com
NEON_DATABASE_URL=postgresql://...
```

**Deployment Checklist**:
- [ ] Set environment variables in Vercel dashboard
- [ ] Deploy (automatic on git push)
- [ ] Test login flow
- [ ] Test API calls from browser console

### 7.3 Vercel Preview Deployments

**Automatic Support**: Regex pattern `https://.*\.vercel\.app` automatically allows all preview URLs.

**No Action Needed**: Preview deployments work without updating backend config.

---

## Troubleshooting

### Problem: CORS Error in Browser

**Symptoms**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Causes**:
1. Frontend URL not in `ALLOWED_ORIGINS`
2. Typo in origin (http vs https, trailing slash)
3. Backend not restarted after env change

**Fixes**:
```bash
# 1. Check actual origin from browser DevTools → Network → Request Headers
# 2. Add to ALLOWED_ORIGINS (exact match)
ALLOWED_ORIGINS=http://localhost:3000,https://exact-url-here.vercel.app

# 3. Restart backend
cd backend && uvicorn src.main:app --reload
```

### Problem: 401 Unauthorized

**Symptoms**: All API calls return 401

**Causes**:
1. JWT token not sent in Authorization header
2. BETTER_AUTH_URL points to wrong frontend
3. JWKS endpoint unreachable
4. Token expired

**Fixes**:
```bash
# 1. Verify token is sent (DevTools → Network → Headers)
Authorization: Bearer eyJ...

# 2. Test JWKS endpoint
curl $BETTER_AUTH_URL/.well-known/jwks.json

# 3. Decode token at jwt.io
# Check: exp (not expired), sub (has user ID)

# 4. Get fresh token (log out and log in)
```

### Problem: 403 Forbidden

**Symptoms**: API call returns 403 "Access denied"

**Cause**: User ID in URL path doesn't match JWT `sub` claim

**Fix**:
```bash
# Decode JWT at jwt.io
# Copy 'sub' value
# Ensure URL uses: /api/{sub-value}/tasks
```

### Problem: 422 Invalid Priority

**Symptoms**: Task creation fails with priority validation error

**Cause**: Frontend sending priority not in `["High", "Medium", "Low"]`

**Fix**: Ensure frontend only sends exact enum values (case-sensitive).

---

## Common Commands

**Restart Backend**:
```bash
cd backend && uvicorn src.main:app --reload
```

**Restart Frontend**:
```bash
cd frontend && npm run dev
```

**Check Backend Logs**:
```bash
# Look for JWT validation errors
tail -f backend/logs/app.log
```

**Test JWKS**:
```bash
curl http://localhost:3000/.well-known/jwks.json | jq
```

**Decode JWT**:
```bash
# Paste token at: https://jwt.io
# Or use CLI:
echo "YOUR_JWT_TOKEN" | base64 -d
```

---

## Next Steps

After successful setup:

1. Run integration tests: `cd backend && pytest tests/integration/test_cors_auth.py`
2. Document any environment-specific issues in project wiki
3. Share this guide with team members

**Support**: If issues persist, check backend logs for detailed error messages.
