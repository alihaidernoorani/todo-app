# JWT Deployment Guide

## Overview

This document provides deployment instructions and requirements for the JWT-based authentication system in the Todo application.

## Environment Variables Checklist

### Required Variables

- `BETTER_AUTH_URL`: Base URL of your Better Auth instance
  - Example: `https://your-app.com` or `http://localhost:3000` (development)
  - Required for JWT validation and JWKS endpoint discovery

### Production Recommended Variables

- `BETTER_AUTH_SECRET`: Shared secret for HS256 verification (development only)
  - Minimum length: 32 characters
  - Use RS256 with JWKS in production for better security
  - Generate with: `openssl rand -hex 32`

### Backend Variables

- `NEON_DATABASE_URL`: PostgreSQL connection string
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
  - Example: `http://localhost:3000,https://your-app.vercel.app`

## JWKS Endpoint Requirements

### Public Accessibility

- The JWKS endpoint (`/.well-known/jwks.json`) must be publicly accessible
- Backend must be able to reach the JWKS endpoint during startup
- Application will fail to start if JWKS endpoint is unreachable

### Expected Response Format

```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "unique-key-id",
      "alg": "RS256",
      "n": "modulus-value",
      "e": "exponent-value"
    }
  ]
}
```

## Deployment Steps

### 1. Prepare Environment Variables

Create or update your `.env` file with required variables:

```bash
# Database Configuration
NEON_DATABASE_URL=postgresql://...

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=false

# Better Auth Configuration
BETTER_AUTH_URL=https://your-better-auth-domain.com

# JWT Secret (optional in production with RS256)
BETTER_AUTH_SECRET=your-32-char-secret-here

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### 2. Validate Configuration

Run the JWT configuration validation script:

```bash
cd backend
./scripts/validate-jwt-config.sh
```

This will check:
- Secret key length
- JWKS endpoint reachability
- JSON response validity
- Supported algorithms

### 3. Deploy Backend

The application will perform startup validation:
- Verify JWKS endpoint is reachable
- Confirm JWKS response contains valid keys
- Fail fast if validation fails

### 4. Deploy Frontend

Frontend will automatically:
- Request JWT from Better Auth
- Store JWT in localStorage
- Inject Authorization header in API calls
- Handle expired token cleanup

## Security Headers Configuration

### Content Security Policy (CSP)

The frontend includes CSP headers to prevent XSS attacks:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://your-api.com;
```

### Additional Security Headers

- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information

## Monitoring and Health Checks

### JWT Validation Metrics

Monitor these key metrics:
- Token validation success rate (should be >99%)
- Expired token frequency
- JWKS endpoint availability
- Cross-user access attempts

### Error Logging

- JWT expiration errors
- Invalid signature errors
- Missing claims errors
- JWKS unreachable errors

## Troubleshooting Common Issues

### Issue: Application Fails to Start

**Symptoms**: Server crashes during startup with "JWKS endpoint returned no keys"

**Causes**:
- Better Auth JWKS endpoint is unreachable
- Network connectivity issues
- Incorrect BETTER_AUTH_URL

**Solutions**:
1. Verify BETTER_AUTH_URL is correct
2. Check network connectivity to the endpoint
3. Ensure JWKS endpoint is publicly accessible
4. Run validation script: `./scripts/validate-jwt-config.sh`

### Issue: 401 Unauthorized Responses

**Symptoms**: API requests return 401 errors

**Causes**:
- Expired JWT tokens
- Invalid JWT signatures
- Missing Authorization header

**Solutions**:
1. Check token expiration (15-minute default)
2. Verify Better Auth is issuing valid JWTs
3. Confirm Authorization header format: `Bearer {token}`

### Issue: Cross-User Access Blocked

**Symptoms**: Requests to other users' resources return 403

**Cause**: JWT `sub` claim doesn't match URL `user_id` parameter

**Solution**: This is expected behavior for security. Users can only access their own resources.

### Issue: Token Not Refreshing

**Symptoms**: Frequent 401 errors after 15 minutes

**Solutions**:
1. Implement token refresh in frontend
2. Check Better Auth JWT configuration
3. Verify JWT expiry time (default 15 minutes)

## Rollback Procedure

If JWT migration causes issues, follow these steps to rollback:

### 1. Backend Rollback

1. Restore previous `dependencies.py` with session validation
2. Re-add session validator imports
3. Revert JWT-specific changes
4. Re-enable session-based authentication

### 2. Frontend Rollback

1. Restore previous `api/client.ts` with session cookies
2. Re-enable `credentials: 'include'` in API calls
3. Remove JWT token storage logic
4. Revert to cookie-based authentication

### 3. Configuration Rollback

1. Re-add session endpoint configurations
2. Restore session-based environment variables
3. Revert to previous authentication flow

## Performance Considerations

### JWKS Caching

- Public keys are cached in memory during application runtime
- Cache TTL: 1 hour (default PyJWKClient behavior)
- Reduces external calls for JWT verification

### Token Validation

- Local signature verification (no network calls)
- Sub-millisecond validation time
- Scales horizontally without shared state

## Scaling Recommendations

### Horizontal Scaling

- Stateless JWT authentication supports horizontal scaling
- No session affinity required
- Each instance validates tokens independently

### Load Balancer Configuration

- No sticky sessions needed
- Round-robin load balancing
- Health checks can verify JWKS availability

## Compliance and Security

### Data Protection

- JWT tokens contain only necessary user information
- No sensitive data stored in tokens
- Tokens are short-lived (15 minutes)

### Auditing

- Log authentication failures
- Track cross-user access attempts
- Monitor token validation patterns

## Contact Information

For deployment issues:

- **Development Team**: [contact information]
- **Security Team**: [contact information]
- **Operations Team**: [contact information]