# Login 400 Error - Changes Summary

## Files Changed

### 1. `src/main/resources/application-prod.properties`
**Change**: Added Railway reverse proxy header handling

```properties
# Railway uses a reverse proxy - trust forwarded headers
server.forward-headers-strategy=framework
```

**Why**: Railway uses a reverse proxy (like nginx) in front of your application. Without this setting, Spring Boot doesn't properly interpret the X-Forwarded-* headers, which can cause:
- Incorrect scheme detection (http vs https)
- Wrong host/port information
- CORS issues
- Security filter problems

**Impact**: This tells Spring Boot to trust and use the forwarded headers from Railway's proxy, ensuring requests are processed correctly.

---

### 2. `RAILWAY_ENV_VARS.md`
**Change**: Updated documentation to show correct frontend URL

**Before**:
```
FRONTEND_URL=https://dietsphere.vercel.app
```

**After**:
```
FRONTEND_URL=https://diet-sphere.vercel.app
```

**Why**: The actual Vercel deployment uses `diet-sphere` (with hyphen), not `dietsphere`. CORS requires an exact match.

---

### 3. `LOGIN_FIX_INSTRUCTIONS.md` (New File)
**Purpose**: Detailed troubleshooting guide for the login 400 error

**Contents**:
- Root cause analysis
- Step-by-step fix instructions
- Verification steps
- Common mistakes to avoid
- Troubleshooting tips

---

## What Needs to Be Done

### In Your Code Repository:
1. ✅ Code changes are complete (application-prod.properties updated)
2. Commit and push changes to trigger Railway redeploy

### In Railway Dashboard:
1. Update `FRONTEND_URL` environment variable to: `https://diet-sphere.vercel.app`
2. Wait for automatic redeploy (or the redeploy from your git push)

### Verification:
1. Test login from `https://diet-sphere.vercel.app`
2. Check browser console for CORS errors (should be none)
3. Verify login returns 200 OK (or 401 for wrong credentials, not 400)

---

## Technical Explanation

### The Two Issues:

**Issue 1: CORS Mismatch**
- Frontend: `https://diet-sphere.vercel.app`
- Backend CORS config: `https://dietsphere.vercel.app` (wrong)
- Result: Browser blocks request due to Origin mismatch

**Issue 2: Proxy Header Handling**
- Railway uses reverse proxy
- Spring Boot wasn't configured to trust forwarded headers
- Result: Backend sees requests as coming from proxy, not actual client
- This can cause CORS checks to fail or security filters to reject requests

### The Fixes:

**Fix 1: Update FRONTEND_URL**
- Set to exact URL: `https://diet-sphere.vercel.app`
- CORS will now allow requests from the correct origin

**Fix 2: Enable Forward Headers Strategy**
- `server.forward-headers-strategy=framework`
- Spring Boot now correctly interprets X-Forwarded-Proto, X-Forwarded-Host, etc.
- Backend sees the actual client request details, not the proxy's

---

## Expected Behavior After Fix

### Before (Broken):
```
POST /api/auth/login
Status: 400 Bad Request
Error: CORS policy or request validation failure
```

### After (Fixed):
```
POST /api/auth/login
Status: 200 OK (valid credentials)
Status: 401 Unauthorized (invalid credentials)
Response: { "token": "...", "user": {...} }
```

---

## Deployment Steps

```bash
# 1. Commit the changes
git add DietSphere/src/main/resources/application-prod.properties
git add DietSphere/RAILWAY_ENV_VARS.md
git add DietSphere/LOGIN_FIX_INSTRUCTIONS.md
git add DietSphere/CHANGES_SUMMARY.md
git commit -m "Fix: Configure Railway proxy headers and update CORS documentation"
git push

# 2. Update Railway environment variable
# Go to Railway dashboard → Variables → Update FRONTEND_URL

# 3. Wait for redeploy (automatic)

# 4. Test the login
# Visit https://diet-sphere.vercel.app and try logging in
```

---

## Rollback Plan (If Needed)

If something goes wrong, you can rollback:

1. **Revert code changes**:
   ```bash
   git revert HEAD
   git push
   ```

2. **Revert environment variable**:
   - Go to Railway → Variables
   - Change FRONTEND_URL back to previous value

---

## Additional Notes

### Why 400 Instead of CORS Error?
Sometimes CORS failures manifest as 400 errors because:
1. The preflight OPTIONS request fails
2. The browser blocks the actual POST request
3. The server never processes the request body
4. Returns a generic 400 instead of a CORS-specific error

### Why Forward Headers Matter?
Railway's architecture:
```
Client → Railway Proxy → Your Spring Boot App
         (adds X-Forwarded-* headers)
```

Without `forward-headers-strategy=framework`:
- Spring sees requests from proxy (internal IP)
- CORS checks might fail
- Security filters might reject requests

With `forward-headers-strategy=framework`:
- Spring sees actual client details
- CORS checks work correctly
- Security filters process requests properly

---

## Testing Checklist

After deployment:
- [ ] Login with valid credentials returns 200 OK
- [ ] Login with invalid credentials returns 401 Unauthorized
- [ ] No CORS errors in browser console
- [ ] JWT token is returned in response
- [ ] User data is returned in response
- [ ] Frontend redirects to dashboard after login
- [ ] Authenticated API calls work (with JWT token)

---

## Support

If issues persist after these fixes:
1. Check Railway logs for errors
2. Check browser console for detailed error messages
3. Test the health endpoint: `https://dietsphere-fsad-production.up.railway.app/api/health`
4. Verify environment variables are set correctly in Railway
5. Ensure database connection is working
