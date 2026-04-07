# Railway Deployment Quick Reference

## 🚀 Quick Start

1. **Create Railway Project**
   - Go to https://railway.app/new
   - Click "Deploy from GitHub repo"
   - Select your DietSphere repository

2. **Add MySQL Database**
   - Click "New" → "Database" → "Add MySQL"
   - Railway auto-configures connection variables

3. **Set Environment Variables**
   ```bash
   SPRING_PROFILES_ACTIVE=prod
   JWT_SECRET=<generate-32-char-random-string>
   FRONTEND_URL=https://your-app.vercel.app
   ```

4. **Initial Schema Setup**
   - Temporarily add: `SPRING_JPA_HIBERNATE_DDL_AUTO=update`
   - Deploy (creates tables)
   - Remove the variable
   - Redeploy

5. **Verify Deployment**
   - Check: `https://your-app.railway.app/api/health`
   - Should return: `{"status": "UP"}`

---

## 📋 Environment Variables Checklist

| Variable | Required | Auto-Set by Railway | Example Value |
|----------|----------|---------------------|---------------|
| `SPRING_PROFILES_ACTIVE` | ✅ Yes | ❌ No | `prod` |
| `MYSQL_URL` | ✅ Yes | ✅ Yes (verify format) | `jdbc:mysql://host:3306/db` |
| `MYSQL_USER` | ✅ Yes | ✅ Yes | `root` |
| `MYSQL_PASSWORD` | ✅ Yes | ✅ Yes | `abc123xyz` |
| `JWT_SECRET` | ✅ Yes | ❌ No | `<32+ char random string>` |
| `FRONTEND_URL` | ✅ Yes | ❌ No | `https://app.vercel.app` |
| `PORT` | ⚠️ Optional | ✅ Yes | `8080` |
| `OLLAMA_URL` | ⚠️ Optional | ❌ No | `https://ollama.railway.app` |

---

## 🔑 Generate JWT Secret

Choose one method:

```bash
# OpenSSL (Linux/Mac/Git Bash)
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# PowerShell (Windows)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Or use: https://generate-secret.vercel.app/32

---

## 🔍 Health Check

**Endpoint**: `/api/health`

**Expected Response**:
```json
{
  "status": "UP"
}
```

**Test Command**:
```bash
curl https://your-app.railway.app/api/health
```

---

## 🐛 Common Issues

### App Won't Start
- ✅ Check `SPRING_PROFILES_ACTIVE=prod` is set
- ✅ Verify all required env vars are present
- ✅ Check Railway logs for errors

### Database Connection Failed
- ✅ Ensure `MYSQL_URL` starts with `jdbc:mysql://`
- ✅ Verify MySQL service is running
- ✅ Check database schema exists

### CORS Errors
- ✅ Verify `FRONTEND_URL` matches exactly (no trailing slash)
- ✅ Include `https://` prefix
- ✅ Check browser console for actual Origin header

### JWT Errors
- ✅ Ensure `JWT_SECRET` is at least 32 characters
- ✅ Verify secret hasn't changed (invalidates tokens)

---

## 📁 Project Structure

```
DietSphere/
├── railway.toml              # Railway deployment config
├── pom.xml                   # Maven build config
├── src/
│   └── main/
│       ├── java/             # Java source code
│       └── resources/
│           ├── application.properties       # Local dev config
│           └── application-prod.properties  # Production config
└── target/
    └── diet-balance-tracker-1.0.0.jar      # Built artifact
```

---

## 🔄 Deployment Flow

```
Push to GitHub
    ↓
Railway detects change
    ↓
Runs: mvn clean package -DskipTests
    ↓
Creates: target/diet-balance-tracker-1.0.0.jar
    ↓
Runs: java -jar target/diet-balance-tracker-1.0.0.jar
    ↓
Health check: /api/health
    ↓
✅ Deployment successful
```

---

## 📞 Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Detailed Guide**: See `RAILWAY_ENV_VARS.md`
