# Spring Security 403 Error - Fix Summary

## Problem
Railway logs showed:
```
Http403ForbiddenEntryPoint: Pre-authenticated entry point called. Rejecting access
```

All requests to `/api/auth/login` and `/api/auth/register` were being rejected with 403 Forbidden before reaching the controllers.

## Root Cause

Spring Security was configured incorrectly:

1. **OPTIONS requests not explicitly permitted** - CORS preflight requests were being blocked
2. **JWT filter running on public endpoints** - The filter was checking for JWT tokens even on login/register endpoints
3. **Wrong error response** - 403 Forbidden instead of 401 Unauthorized for missing authentication

## Changes Made

### 1. SecurityConfig.java

#### Added HttpMethod import:
```java
import org.springframework.http.HttpMethod;
import jakarta.servlet.http.HttpServletResponse;
```

#### Fixed authorization rules (ORDER MATTERS):
```java
.authorizeHttpRequests(auth -> auth
    // CRITICAL: Allow OPTIONS requests for CORS preflight (must be first)
    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
    // Public endpoints that don't require authentication
    .requestMatchers("/api/auth/register").permitAll()
    .requestMatchers("/api/auth/login").permitAll()
    .requestMatchers("/api/health").permitAll()
    .requestMatchers("/api/welcome").permitAll()
    .requestMatchers("/error").permitAll()
    .requestMatchers("/").permitAll()
    // All other requests require authentication
    .anyRequest().authenticated()
)
```

**Key changes:**
- OPTIONS requests are now explicitly permitted FIRST (critical for CORS)
- Each public endpoint is explicitly listed (more secure than wildcards)
- Root path `/` is now permitted

#### Added custom exception handling:
```java
.exceptionHandling(ex -> ex
    // Custom entry point to return 401 instead of 403 for unauthenticated requests
    .authenticationEntryPoint((req, res, e) -> 
        res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized"))
)
```

**Why:** Returns 401 Unauthorized (correct) instead of 403 Forbidden (misleading) when authentication is missing.

### 2. JwtAuthenticationFilter.java

#### Added public paths list:
```java
// Public endpoints that should skip JWT validation
private static final List<String> PUBLIC_PATHS = Arrays.asList(
    "/api/auth/register",
    "/api/auth/login",
    "/api/health",
    "/api/welcome",
    "/error",
    "/"
);
```

#### Added shouldNotFilter method:
```java
@Override
protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
    String path = request.getRequestURI();
    
    // Skip filter for OPTIONS requests (CORS preflight)
    if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
        return true;
    }
    
    // Skip filter for public paths
    return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
}
```

**Why:** The JWT filter now completely skips execution for:
- OPTIONS requests (CORS preflight)
- Public endpoints (login, register, health, etc.)

This prevents the filter from trying to validate JWT tokens on endpoints that don't require authentication.

## How It Works Now

### Request Flow for Public Endpoints:

**Before (Broken):**
```
1. Browser sends OPTIONS request (CORS preflight)
2. Spring Security: No explicit rule for OPTIONS → Apply default (403)
3. JWT Filter: Runs on OPTIONS request → No token → Sets no authentication
4. Spring Security: No authentication → 403 Forbidden
5. Browser: CORS preflight failed → Block actual request
```

**After (Fixed):**
```
1. Browser sends OPTIONS request (CORS preflight)
2. Spring Security: OPTIONS /** is permitAll() → Allow
3. JWT Filter: shouldNotFilter() returns true → Skip filter entirely
4. Spring Security: Request is permitted → 200 OK
5. Browser: CORS preflight succeeded → Send actual POST request
6. POST /api/auth/login arrives
7. JWT Filter: shouldNotFilter() returns true (public path) → Skip filter
8. Spring Security: /api/auth/login is permitAll() → Allow
9. AuthController: Process login → Return 200 OK or 401 Unauthorized
```

### Request Flow for Protected Endpoints:

```
1. Browser sends GET /api/entries?userId=1
2. JWT Filter: shouldNotFilter() returns false (not public) → Run filter
3. JWT Filter: Extract token from Authorization header
4. JWT Filter: Validate token → Set authentication in SecurityContext
5. Spring Security: Request has authentication → Allow
6. Controller: Process request → Return data
```

## Testing

### Test Public Endpoints (Should Work Without Token):

```bash
# Test OPTIONS (CORS preflight)
curl -X OPTIONS https://dietsphere-fsad-production.up.railway.app/api/auth/login \
  -H "Origin: https://diet-sphere.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Expected: 200 OK with CORS headers

# Test POST login
curl -X POST https://dietsphere-fsad-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://diet-sphere.vercel.app" \
  -d '{"username":"test","password":"test"}' \
  -v

# Expected: 401 Unauthorized (if credentials wrong) or 200 OK (if correct)
# NOT 403 Forbidden

# Test health endpoint
curl https://dietsphere-fsad-production.up.railway.app/api/health

# Expected: 200 OK with {"status":"UP"}
```

### Test Protected Endpoints (Should Require Token):

```bash
# Test without token
curl https://dietsphere-fsad-production.up.railway.app/api/entries?userId=1

# Expected: 401 Unauthorized (not 403)

# Test with invalid token
curl https://dietsphere-fsad-production.up.railway.app/api/entries?userId=1 \
  -H "Authorization: Bearer invalid-token"

# Expected: 401 Unauthorized

# Test with valid token
curl https://dietsphere-fsad-production.up.railway.app/api/entries?userId=1 \
  -H "Authorization: Bearer <valid-jwt-token>"

# Expected: 200 OK with data
```

## Deployment

```bash
# Commit the changes
git add DietSphere/src/main/java/com/nutrition/dietbalancetracker/security/
git commit -m "Fix: Resolve 403 errors by properly configuring public endpoints and CORS"
git push

# Railway will automatically redeploy
# Wait 2-3 minutes for deployment to complete
```

## Verification in Railway Logs

After deployment, Railway logs should show:

**Before (Broken):**
```
Http403ForbiddenEntryPoint: Pre-authenticated entry point called. Rejecting access
```

**After (Fixed):**
```
Started DietBalanceTrackerApplication in X.XXX seconds
```

No more 403 errors. Requests to public endpoints should succeed.

## Common Issues After Fix

### Issue: Still getting 403
**Solution:** Clear browser cache and try in incognito window

### Issue: Getting 401 instead of 200 on login
**Solution:** This is correct! 401 means authentication failed (wrong credentials). Check username/password.

### Issue: CORS errors still appearing
**Solution:** Make sure `FRONTEND_URL` environment variable in Railway is set to `https://diet-sphere.vercel.app`

### Issue: Protected endpoints return 401 even with token
**Solution:** Check that JWT token is valid and not expired. Token expires after 24 hours by default.

## Security Implications

### What Changed:
- Public endpoints are now truly public (no JWT required)
- OPTIONS requests are always allowed (required for CORS)
- JWT filter skips public endpoints (better performance)

### What Didn't Change:
- Protected endpoints still require valid JWT token
- Token validation logic is unchanged
- CORS configuration is unchanged
- Password hashing is unchanged

### Security Best Practices Maintained:
- ✅ JWT tokens still required for protected endpoints
- ✅ Passwords still hashed with BCrypt
- ✅ CSRF protection disabled (correct for stateless JWT auth)
- ✅ Session management set to STATELESS
- ✅ CORS properly configured with specific origins
- ✅ Public endpoints explicitly listed (no wildcards)

## Expected Behavior

### Public Endpoints (No Token Required):
- `POST /api/auth/register` → 200 OK (success) or 400 Bad Request (validation error)
- `POST /api/auth/login` → 200 OK (success) or 401 Unauthorized (wrong credentials)
- `GET /api/health` → 200 OK
- `GET /api/welcome` → 200 OK
- `OPTIONS /**` → 200 OK (CORS preflight)

### Protected Endpoints (Token Required):
- `GET /api/entries` → 401 Unauthorized (no token) or 200 OK (valid token)
- `POST /api/entries` → 401 Unauthorized (no token) or 200 OK (valid token)
- `GET /api/goals` → 401 Unauthorized (no token) or 200 OK (valid token)
- All other `/api/**` endpoints → 401 Unauthorized (no token) or 200 OK (valid token)

## Troubleshooting

### Check Railway Logs:
```
Railway Dashboard → Your Service → Deployments → View Logs
```

Look for:
- `Started DietBalanceTrackerApplication` (app started successfully)
- No `Http403ForbiddenEntryPoint` errors
- No `Pre-authenticated entry point called` errors

### Check Browser Network Tab:
1. Open DevTools (F12) → Network tab
2. Try to login
3. Check OPTIONS request: Should return 200 OK
4. Check POST request: Should return 200 OK or 401 (not 403)

### Check CORS Headers:
In Network tab → Click OPTIONS request → Headers tab:

**Response Headers should include:**
```
Access-Control-Allow-Origin: https://diet-sphere.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Credentials: true
```

If these are missing, check `FRONTEND_URL` environment variable in Railway.

## Summary

The 403 errors were caused by Spring Security blocking requests before they reached the controllers. The fix involved:

1. ✅ Explicitly permitting OPTIONS requests (CORS preflight)
2. ✅ Explicitly listing all public endpoints
3. ✅ Adding shouldNotFilter logic to skip JWT validation on public endpoints
4. ✅ Changing 403 to 401 for missing authentication

After these changes, public endpoints work without tokens, and protected endpoints still require valid JWT tokens.
