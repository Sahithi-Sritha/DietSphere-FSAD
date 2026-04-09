# Railway Environment Variables Configuration

This document lists all environment variables you need to set in Railway's dashboard for the DietSphere backend to work properly.

## How to Set Environment Variables in Railway

1. Go to your Railway project dashboard
2. Click on your service (backend)
3. Go to the "Variables" tab
4. Click "New Variable" for each variable below
5. Enter the variable name and value
6. Click "Add" and Railway will automatically redeploy

---

## Required Environment Variables

### 1. SPRING_PROFILES_ACTIVE
**Description**: Tells Spring Boot to use the production configuration file (`application-prod.properties`)

**Value**: 
```
prod
```

**Why it's needed**: Without this, Spring Boot will use the development configuration with hardcoded localhost values.

---

### 2. MYSQL_URL
**Description**: JDBC connection URL for your MySQL database

**Format**: 
```
jdbc:mysql://<host>:<port>/<database>?createDatabaseIfNotExist=true
```

**Example**: 
```
jdbc:mysql://containers-us-west-123.railway.app:3306/railway
```

**How to get it**: 
- Railway automatically provides MySQL connection details when you add a MySQL service
- Go to your MySQL service → Variables tab
- Look for `MYSQL_URL` or construct it from `MYSQL_HOST`, `MYSQL_PORT`, and `MYSQL_DATABASE`
- Make sure it starts with `jdbc:mysql://` (not just `mysql://`)

**Railway Auto-Setup**: If you add a MySQL database service to your project, Railway may automatically set this variable. Verify it's in JDBC format.

---

### 3. MYSQL_USER
**Description**: Username for MySQL database authentication

**Example**: 
```
root
```

**How to get it**: 
- Railway automatically provides this when you add a MySQL service
- Go to your MySQL service → Variables tab → Look for `MYSQL_USER`

**Railway Auto-Setup**: Usually set automatically when you add MySQL service.

---

### 4. MYSQL_PASSWORD
**Description**: Password for MySQL database authentication

**Example**: 
```
your-secure-mysql-password
```

**How to get it**: 
- Railway automatically provides this when you add a MySQL service
- Go to your MySQL service → Variables tab → Look for `MYSQL_PASSWORD`

**Railway Auto-Setup**: Usually set automatically when you add MySQL service.

---

### 5. JWT_SECRET
**Description**: Secret key used to sign and verify JWT authentication tokens. Must be at least 32 characters long.

**Security**: This is a critical security value. Use a strong, random string.

**How to generate**:

#### Option 1: Using OpenSSL (Linux/Mac/Git Bash)
```bash
openssl rand -base64 32
```

#### Option 2: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Option 3: Using Python
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### Option 4: Using PowerShell (Windows)
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

#### Option 5: Online Generator
Visit: https://generate-secret.vercel.app/32

**Example value**: 
```
Xk7mP9vR2wQ8nL5tY3jH6bN4cV1zS0aF8dG2eK9mW7x
```

**Important**: 
- Never commit this to Git
- Use a different secret for each environment (dev, staging, prod)
- Rotate this periodically for security

---

### 6. FRONTEND_URL
**Description**: Your frontend application URL(s) for CORS (Cross-Origin Resource Sharing) configuration. Allows the frontend to make API requests to the backend.

**Format**: Comma-separated list of URLs (no trailing slashes)

**Examples**:

Single URL:
```
https://dietsphere.vercel.app
```

Multiple URLs (production + staging):
```
https://dietsphere.vercel.app,https://dietsphere-staging.vercel.app
```

With localhost for testing:
```
https://dietsphere.vercel.app,http://localhost:5173
```

**Default**: If not set, falls back to `http://localhost:5173`

**Important**: 
- Include `https://` or `http://` prefix
- No trailing slash
- Separate multiple URLs with commas (no spaces)
- Must match exactly what the browser sends in the Origin header

---

## Optional Environment Variables

### 7. PORT
**Description**: Port number where the Spring Boot application listens for HTTP requests

**Default**: `8080`

**Railway Behavior**: Railway automatically sets this variable. You usually don't need to set it manually.

**Value**: 
```
8080
```

---

### 8. OLLAMA_URL
**Description**: URL for the Ollama AI service (if you have a hosted Ollama instance)

**Default**: `http://localhost:11434` (won't work in production, but app will handle gracefully)

**Example**: 
```
https://your-ollama-service.railway.app
```

**Note**: This is optional. If you don't have an Ollama service, the AI chat feature won't work, but the rest of the app will function normally.

---

## Quick Setup Checklist

Use this checklist when setting up a new Railway deployment:

- [ ] Add MySQL database service to Railway project
- [ ] Verify `MYSQL_URL` is in JDBC format (`jdbc:mysql://...`)
- [ ] Verify `MYSQL_USER` is set (usually automatic)
- [ ] Verify `MYSQL_PASSWORD` is set (usually automatic)
- [ ] Set `SPRING_PROFILES_ACTIVE=prod`
- [ ] Generate and set `JWT_SECRET` (at least 32 characters)
- [ ] Set `FRONTEND_URL` to your Vercel deployment URL
- [ ] Deploy and check logs for any errors
- [ ] Test health check: `https://your-app.railway.app/api/health`
- [ ] Test CORS by trying to login from your frontend

---

## Database Schema Setup

Since production uses `spring.jpa.hibernate.ddl-auto=validate`, you need to create the database schema before the app can start.

### Option 1: Temporary Update Mode (Recommended for First Deployment)

1. Add temporary environment variable:
   ```
   SPRING_JPA_HIBERNATE_DDL_AUTO=update
   ```

2. Deploy the app (it will create all tables automatically)

3. Remove the `SPRING_JPA_HIBERNATE_DDL_AUTO` variable

4. Redeploy (it will now use `validate` mode from application-prod.properties)

### Option 2: Manual Schema Creation

1. Connect to your Railway MySQL database using a MySQL client
2. Run your schema creation SQL scripts
3. Deploy with `validate` mode

---

## Troubleshooting

### App won't start
- Check Railway logs for error messages
- Verify all required environment variables are set
- Ensure `SPRING_PROFILES_ACTIVE=prod` is set
- Check that `MYSQL_URL` is in JDBC format (starts with `jdbc:mysql://`)

### Database connection errors
- Verify MySQL service is running in Railway
- Check that `MYSQL_URL`, `MYSQL_USER`, and `MYSQL_PASSWORD` are correct
- Ensure database schema exists (see "Database Schema Setup" above)

### CORS errors in browser
- Verify `FRONTEND_URL` exactly matches your Vercel URL
- Check for trailing slashes (should not have them)
- Ensure URL includes `https://` prefix
- Check Railway logs for CORS-related messages

### JWT authentication errors
- Ensure `JWT_SECRET` is at least 32 characters
- Verify the secret hasn't changed (would invalidate existing tokens)
- Check that users are logging in with correct credentials

### Health check failing
- Check that app is actually starting (view logs)
- Verify `/api/health` endpoint is accessible
- Ensure port 8080 is being used

---

## Security Best Practices

1. **Never commit secrets to Git**
   - Use Railway's environment variables for all sensitive data
   - Add `.env` files to `.gitignore`

2. **Use strong secrets**
   - JWT_SECRET should be at least 32 characters
   - Use cryptographically secure random generation

3. **Rotate secrets periodically**
   - Change JWT_SECRET every few months
   - Update database passwords regularly

4. **Use different secrets per environment**
   - Dev, staging, and production should have different JWT secrets
   - Never reuse production secrets in development

5. **Enable Railway's security features**
   - Use private networking for database connections
   - Enable automatic SSL/TLS (Railway does this by default)

---

## Example: Complete Railway Setup

Here's what your Railway environment variables should look like:

```bash
# Required
SPRING_PROFILES_ACTIVE=prod
MYSQL_URL=jdbc:mysql://containers-us-west-123.railway.app:3306/railway
MYSQL_USER=root
MYSQL_PASSWORD=abc123xyz789
JWT_SECRET=Xk7mP9vR2wQ8nL5tY3jH6bN4cV1zS0aF8dG2eK9mW7x
FRONTEND_URL=https://dietsphere.vercel.app

# Optional (Railway sets automatically)
PORT=8080

# Optional (if you have Ollama)
OLLAMA_URL=https://ollama-service.railway.app
```

---

## Support Resources

- **Railway Documentation**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Spring Boot Documentation**: https://spring.io/projects/spring-boot
- **MySQL Documentation**: https://dev.mysql.com/doc/
