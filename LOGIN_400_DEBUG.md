# Login 400 Error - Debugging Guide

## Current Status

Frontend console shows:
```
checkSupportDomain domain: diet-sphere.vercel.app
POST https://dietsphere-fsad-production.up.railway.app/api/auth/login 400 (Bad Request)
```

## Root Cause Analysis

The 400 error can happen for THREE reasons:

### 1. CORS Preflight Failure (Most Likely)
- Browser sends OPTIONS request first (CORS preflight)
- If CORS is misconfigured, OPTIONS returns 400 or fails
- Browser blocks the actual POST request
- You see 400 in console

### 2. Request Body Validation Failure
- Backend receives the request
- `@Valid` annotation triggers validation
- `@NotBlank` on username or password fails
- Returns 400 with validation error

### 3. Content-Type Mismatch
- Frontend sends wrong Content-Type header
- Backend expects `application/json`
- Spring rejects the request with 400

## Diagnostic Steps

### Step 1: Check CORS Preflight

Open browser DevTools → Network tab → Try to login:

1. Look for an OPTIONS request to `/api/auth/login`
2. Check the response:
   - **If 200 OK**: CORS is working, problem is elsewhere
   - **If 403/400/404**: CORS is misconfigured
   - **If no OPTIONS request**: CORS might be completely broken

### Step 2: Check Request Headers

In Network tab, click the failed POST request:

**Headers tab → Request Headers:**
```
Origin: https://diet-sphere.vercel.app
Content-Type: application/json
```

**Headers tab → Response Headers (should have):**
```
Access-Control-Allow-Origin: https://diet-sphere.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Credentials: true
```

**If these are missing**: CORS is not configured correctly

### Step 3: Check Request Payload

In Network tab → Payload tab:
```json
{
  "username": "your-username",
  "password": "your-password"
}
```

**If payload is empty or malformed**: Frontend issue
**If payload looks correct**: Backend validation issue

### Step 4: Check Response Body

In Network tab → Response tab:

**If you see**:
```json
{
  "errors": [
    {
      "field": "username",
      "defaultMessage": "Username is required"
    }
  ]
}
```
→ Validation error (username/password is blank)

**If you see**:
```
CORS policy: No 'Access-Control-Allow-Origin' header
```
→ CORS misconfiguration

**If response is empty**: Likely CORS preflight failure

## The Fix

Based on the error, you need to:

### Fix 1: Update Railway Environment Variable

**CRITICAL**: Your `FRONTEND_URL` in Railway MUST be:
```
https://diet-sphere.vercel.app
```

**NOT**:
- ~~`https://dietsphere.vercel.app`~~ (missing hyphen)
- ~~`https://diet-sphere.vercel.app/`~~ (trailing slash)
- ~~`http://diet-sphere.vercel.app`~~ (http instead of https)

### Fix 2: Redeploy Backend

After updating `FRONTEND_URL`:
1. Railway will automatically redeploy
2. Wait 2-3 minutes for deployment to complete
3. Check Railway logs to confirm new FRONTEND_URL is loaded

### Fix 3: Clear Browser Cache

After backend redeploys:
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Or clear browser cache completely
3. Try login again

## Verification Commands

### Test CORS from Command Line

```bash
# Test OPTIONS (preflight)
curl -X OPTIONS https://dietsphere-fsad-production.up.railway.app/api/auth/login \
  -H "Origin: https://diet-sphere.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Should return:
# < HTTP/1.1 200 OK
# < Access-Control-Allow-Origin: https://diet-sphere.vercel.app
# < Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

### Test Actual Login Request

```bash
# Test POST (actual login)
curl -X POST https://dietsphere-fsad-production.up.railway.app/api/auth/login \
  -H "Origin: https://diet-sphere.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}' \
  -v

# Should return:
# < HTTP/1.1 401 Unauthorized (if credentials wrong)
# < HTTP/1.1 200 OK (if credentials correct)
# NOT 400 Bad Request
```

### Test Health Endpoint

```bash
# Verify backend is running
curl https://dietsphere-fsad-production.up.railway.app/api/health

# Should return:
# {"status":"UP"}
```

## Common Mistakes

### Mistake 1: Wrong URL Format
```
❌ FRONTEND_URL=diet-sphere.vercel.app
✅ FRONTEND_URL=https://diet-sphere.vercel.app
```

### Mistake 2: Trailing Slash
```
❌ FRONTEND_URL=https://diet-sphere.vercel.app/
✅ FRONTEND_URL=https://diet-sphere.vercel.app
```

### Mistake 3: Multiple URLs with Spaces
```
❌ FRONTEND_URL=https://diet-sphere.vercel.app, http://localhost:5173
✅ FRONTEND_URL=https://diet-sphere.vercel.app,http://localhost:5173
```

### Mistake 4: Not Waiting for Redeploy
- After changing environment variable, Railway needs 2-3 minutes to redeploy
- Check Railway logs to confirm deployment is complete
- Look for "Started DietBalanceTrackerApplication" in logs

### Mistake 5: Browser Cache
- Browser caches CORS responses
- Hard refresh or clear cache after backend changes
- Or use incognito/private window for testing

## Railway Logs to Check

Go to Railway → Your Service → Deployments → View Logs

**Look for**:
```
CORS configuration loaded with origins: [https://diet-sphere.vercel.app]
```

**Or**:
```
Allowed origins: [https://diet-sphere.vercel.app]
```

**If you see**:
```
Allowed origins: [http://localhost:5173, http://localhost:3000]
```
→ FRONTEND_URL environment variable is not set or not loaded

## Frontend Environment Variable

Also check Vercel environment variables:

1. Go to Vercel dashboard
2. Select your project (diet-sphere)
3. Settings → Environment Variables
4. Check if `VITE_API_URL` is set to:
   ```
   https://dietsphere-fsad-production.up.railway.app/api
   ```

If not set, add it and redeploy frontend.

## Still Not Working?

If after all fixes it still returns 400:

### Enable Debug Logging

Add to Railway environment variables:
```
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_WEB=DEBUG
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_SECURITY=DEBUG
```

Redeploy and check logs for detailed CORS and security filter information.

### Check Database Connection

The 400 might be caused by database connection failure:

```bash
# Check if MySQL is running in Railway
# Go to Railway → MySQL service → Check status
```

If database is down, the app might return 400 for all requests.

### Check Application Startup

In Railway logs, look for:
```
Started DietBalanceTrackerApplication in X.XXX seconds
```

If you see errors before this line, the app didn't start correctly.

## Expected Behavior After Fix

### Before (Broken):
```
OPTIONS /api/auth/login → 400 or no response
POST /api/auth/login → 400 Bad Request
Console: CORS error or 400 error
```

### After (Fixed):
```
OPTIONS /api/auth/login → 200 OK
POST /api/auth/login → 200 OK (valid creds) or 401 (invalid creds)
Console: No CORS errors
Login: Successful redirect to dashboard
```

## Quick Checklist

- [ ] Railway `FRONTEND_URL` = `https://diet-sphere.vercel.app` (exact match)
- [ ] No trailing slash in FRONTEND_URL
- [ ] Railway backend has redeployed (check logs)
- [ ] Backend logs show correct CORS origins
- [ ] Vercel `VITE_API_URL` = `https://dietsphere-fsad-production.up.railway.app/api`
- [ ] Frontend has redeployed on Vercel
- [ ] Browser cache cleared (hard refresh)
- [ ] OPTIONS request returns 200 OK
- [ ] POST request returns 200 or 401 (not 400)
- [ ] No CORS errors in console

## Contact Points

If still stuck, provide:
1. Screenshot of Network tab showing the failed request
2. Request headers from Network tab
3. Response headers from Network tab
4. Railway logs (last 50 lines)
5. Vercel environment variables screenshot
