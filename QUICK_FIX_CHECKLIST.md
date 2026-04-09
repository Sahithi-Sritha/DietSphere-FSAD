# Quick Fix Checklist for Login 400 Error

## The Problem
Frontend at `https://diet-sphere.vercel.app` gets 400 Bad Request when calling backend at `https://dietsphere-fsad-production.up.railway.app/api/auth/login`

## The Solution (3 Steps)

### Step 1: Fix Railway Backend (CORS Configuration)

1. Go to https://railway.app
2. Open your DietSphere backend project
3. Click "Variables" tab
4. Find or add `FRONTEND_URL` variable
5. Set value to EXACTLY:
   ```
   https://diet-sphere.vercel.app
   ```
6. Save (Railway will auto-redeploy)
7. Wait 2-3 minutes for deployment

### Step 2: Fix Vercel Frontend (API URL)

1. Go to https://vercel.com
2. Open your diet-sphere project
3. Settings → Environment Variables
4. Find or add `VITE_API_URL` variable
5. Set value to:
   ```
   https://dietsphere-fsad-production.up.railway.app/api
   ```
6. Save
7. Redeploy: Deployments → Latest → Redeploy

### Step 3: Test

1. Wait for both deployments to complete
2. Open https://diet-sphere.vercel.app in incognito/private window
3. Open DevTools (F12) → Network tab
4. Try to login
5. Check for:
   - ✅ OPTIONS request returns 200 OK
   - ✅ POST request returns 200 OK or 401 (not 400)
   - ✅ No CORS errors in console

## If Still Not Working

### Check Railway Logs

1. Railway → Your service → Deployments → View Logs
2. Look for: `Started DietBalanceTrackerApplication`
3. Look for: CORS configuration with your frontend URL

### Check Network Tab

1. Click the failed POST request
2. Headers tab → Check:
   - Request URL: Should be `https://dietsphere-fsad-production.up.railway.app/api/auth/login`
   - Origin: Should be `https://diet-sphere.vercel.app`
   - Content-Type: Should be `application/json`
3. Response tab → Check for error message

### Common Issues

**Issue**: Still getting 400
**Fix**: Clear browser cache (Ctrl+Shift+Delete) and try again

**Issue**: CORS error in console
**Fix**: Double-check FRONTEND_URL in Railway matches EXACTLY (no trailing slash, with https://)

**Issue**: "Network Error" instead of 400
**Fix**: Check if backend is actually running (visit health endpoint: `https://dietsphere-fsad-production.up.railway.app/api/health`)

## Expected Result

After fixes:
- Login with valid credentials → Redirects to dashboard
- Login with invalid credentials → Shows "Invalid username or password" error
- No 400 errors
- No CORS errors

## Code Changes Already Made

✅ Backend: Added `server.forward-headers-strategy=framework` in application-prod.properties
✅ Frontend: All charts fixed with explicit heights
✅ Documentation: Updated RAILWAY_ENV_VARS.md with correct URL format

Now you just need to update the environment variables in Railway and Vercel dashboards.
