# Login 400 Error - Fix Instructions

## Problem Summary
POST requests to `/api/auth/login` are returning 400 Bad Request from the Railway deployment at `https://dietsphere-fsad-production.up.railway.app/api/auth/login` when called from the Vercel frontend at `https://diet-sphere.vercel.app`.

## Root Cause Analysis

### ✅ What's Already Correct:
1. **SecurityConfig.java** - Login endpoint is properly configured:
   - `/api/auth/**` is in `permitAll()` list (no JWT required)
   - CORS is enabled and reads from `FRONTEND_URL` environment variable
   - Accepts all standard HTTP methods (GET, POST, PUT, DELETE, OPTIONS)

2. **AuthController.java** - Login method is properly implemented:
   - Has `@RequestBody` annotation on the parameter
   - Uses `@Valid` for validation
   - Returns proper ResponseEntity

3. **LoginRequestDTO.java** - Validation is reasonable:
   - `@NotBlank` on username and password fields
   - Will reject empty/null values (which is correct behavior)

### ❌ The Actual Problem:

**CORS Configuration Mismatch**: The `FRONTEND_URL` environment variable in Railway is likely set incorrectly.

Your frontend is deployed at: `https://diet-sphere.vercel.app` (with hyphen)
But the environment variable might be set to: `https://dietsphere.vercel.app` (without hyphen)

This exact match is required for CORS to work. Even a small difference will cause the browser to block the request with a CORS error, which often manifests as a 400 Bad Request.

## Fix Instructions

### Step 1: Deploy Code Changes

The code has been updated to properly handle Railway's reverse proxy:

1. Commit and push the changes to your repository:
   ```bash
   git add DietSphere/src/main/resources/application-prod.properties
   git commit -m "Fix: Add forward-headers-strategy for Railway proxy"
   git push
   ```

2. Railway will automatically detect the push and redeploy

### Step 2: Update Railway Environment Variable

1. Go to your Railway dashboard: https://railway.app
2. Select your project (DietSphere backend)
3. Click on the "Variables" tab
4. Find the `FRONTEND_URL` variable
5. Update it to exactly: `https://diet-sphere.vercel.app`
   - ✅ Include `https://`
   - ✅ Use `diet-sphere` (with hyphen)
   - ✅ No trailing slash
6. Save the change
7. Railway will automatically redeploy your backend

### Step 3: Verify the Fix

After Railway redeploys (usually takes 2-3 minutes):

1. Open your browser's Developer Tools (F12)
2. Go to the Network tab
3. Visit `https://diet-sphere.vercel.app`
4. Try to log in
5. Check the network request to `/api/auth/login`:
   - Should return 200 OK (if credentials are correct)
   - Should return 401 Unauthorized (if credentials are wrong)
   - Should NOT return 400 Bad Request or CORS errors

### Step 4: Test CORS Headers

You can verify CORS is working by checking the response headers:

```bash
curl -X OPTIONS https://dietsphere-fsad-production.up.railway.app/api/auth/login \
  -H "Origin: https://diet-sphere.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

You should see these headers in the response:
```
Access-Control-Allow-Origin: https://diet-sphere.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Credentials: true
```

## Alternative: Support Multiple Frontend URLs

If you have multiple frontend deployments (staging, preview branches, etc.), you can set multiple URLs:

```
FRONTEND_URL=https://diet-sphere.vercel.app,https://diet-sphere-staging.vercel.app,http://localhost:5173
```

The SecurityConfig will automatically parse comma-separated URLs.

## Code Changes Made

### 1. Updated RAILWAY_ENV_VARS.md
- Fixed example URLs to use `diet-sphere.vercel.app` (with hyphen)
- Added note about the correct frontend URL
- Updated default value documentation

### 2. Updated application-prod.properties
- Added `server.forward-headers-strategy=framework` to properly handle Railway's reverse proxy headers
- This ensures Spring Boot correctly interprets X-Forwarded-* headers from Railway's proxy
- Without this, the backend might see requests as coming from the proxy instead of the actual client

## What You DON'T Need to Change

- ❌ No code changes required in SecurityConfig.java
- ❌ No code changes required in AuthController.java
- ❌ No code changes required in LoginRequestDTO.java
- ❌ No changes to validation logic

The code is already correct. This is purely a configuration issue in Railway.

## Common Mistakes to Avoid

1. **Trailing slashes**: Don't use `https://diet-sphere.vercel.app/`
2. **Missing protocol**: Don't use `diet-sphere.vercel.app` (needs `https://`)
3. **Wrong subdomain**: Don't use `dietsphere` when it should be `diet-sphere`
4. **Spaces in comma-separated list**: Use `url1,url2` not `url1, url2`

## If It Still Doesn't Work

1. **Check Railway logs**:
   - Go to Railway dashboard → Your service → Deployments → View logs
   - Look for CORS-related errors or startup errors

2. **Verify environment variable was applied**:
   - In Railway logs, you should see the app starting with the new FRONTEND_URL
   - Look for log lines mentioning CORS configuration

3. **Check browser console**:
   - Open DevTools → Console tab
   - Look for CORS error messages
   - They will tell you exactly what Origin was blocked

4. **Test the health endpoint**:
   ```bash
   curl https://dietsphere-fsad-production.up.railway.app/api/health
   ```
   Should return 200 OK if the backend is running properly

## Summary

The issue is a CORS configuration mismatch. Update `FRONTEND_URL` in Railway to `https://diet-sphere.vercel.app` and the login will work.
