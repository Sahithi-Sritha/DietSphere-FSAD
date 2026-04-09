# Railway Deployment Guide

This guide will help you deploy your DietSphere application to Railway.

## Prerequisites

1. A Railway account (sign up at https://railway.app)
2. Your frontend deployed to Vercel (or another hosting service)
3. A MySQL database (Railway provides this)

## Step 1: Create a New Project on Railway

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your DietSphere repository
4. Railway will automatically detect it's a Spring Boot app

## Step 2: Add MySQL Database

1. In your Railway project, click "New"
2. Select "Database" → "Add MySQL"
3. Railway will automatically create a MySQL instance and provide connection details

## Step 3: Configure Environment Variables

In your Railway project settings, add these environment variables:

### Required Variables

```bash
# Spring Profile (tells Spring to use application-prod.properties)
SPRING_PROFILES_ACTIVE=prod

# Database Configuration (Railway auto-provides these when you add MySQL)
# These should be automatically set, but verify they exist:
MYSQL_URL=jdbc:mysql://<host>:<port>/<database>
MYSQL_USER=<username>
MYSQL_PASSWORD=<password>

# JWT Secret (generate a strong random string, at least 32 characters)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Frontend URL (your Vercel deployment URL)
FRONTEND_URL=https://your-app.vercel.app
```

### Optional Variables

```bash
# Ollama AI Service (if you have a hosted Ollama instance)
OLLAMA_URL=https://your-ollama-service.com

# Port (Railway usually sets this automatically)
PORT=8080
```

## Step 4: Generate a Strong JWT Secret

Use one of these methods to generate a secure JWT secret:

### Option 1: Using OpenSSL (Linux/Mac/Git Bash)
```bash
openssl rand -base64 32
```

### Option 2: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Option 3: Using Python
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Option 4: Online Generator
Visit: https://generate-secret.vercel.app/32

## Step 5: Configure Railway MySQL Connection

Railway provides MySQL connection details in the format:
```
mysql://user:password@host:port/database
```

You need to convert this to JDBC format:
```
jdbc:mysql://host:port/database
```

Railway should automatically set `MYSQL_URL`, `MYSQL_USER`, and `MYSQL_PASSWORD` when you add the MySQL service. If not, you can find them in the MySQL service's "Variables" tab.

## Step 6: Initial Database Setup

Since production uses `spring.jpa.hibernate.ddl-auto=validate`, you need to create the schema first:

### Option 1: Temporary Update Mode (Easiest)
1. Temporarily set environment variable: `SPRING_JPA_HIBERNATE_DDL_AUTO=update`
2. Deploy and let the app create tables
3. Remove the variable (it will default back to `validate`)
4. Redeploy

### Option 2: Manual Schema Creation
1. Connect to your Railway MySQL database
2. Run your schema creation scripts manually
3. Deploy with `validate` mode

## Step 7: Deploy

1. Push your code to GitHub
2. Railway will automatically detect changes and deploy
3. Check the deployment logs for any errors
4. Your API will be available at: `https://your-app.up.railway.app`

## Step 8: Update Frontend Configuration

Update your Vercel frontend environment variables:

```bash
VITE_API_URL=https://your-app.up.railway.app
```

Redeploy your frontend.

## Verification Checklist

- [ ] MySQL database is running on Railway
- [ ] All environment variables are set correctly
- [ ] `SPRING_PROFILES_ACTIVE=prod` is set
- [ ] JWT_SECRET is at least 32 characters
- [ ] FRONTEND_URL matches your Vercel deployment
- [ ] Database schema is created
- [ ] Application starts without errors
- [ ] Health check endpoint works: `https://your-app.up.railway.app/api/health`
- [ ] Frontend can connect to backend
- [ ] CORS is working (no CORS errors in browser console)
- [ ] Authentication works (login/register)

## Troubleshooting

### Database Connection Issues
- Verify `MYSQL_URL` is in JDBC format: `jdbc:mysql://host:port/database`
- Check that Railway MySQL service is running
- Ensure database credentials are correct

### CORS Errors
- Verify `FRONTEND_URL` exactly matches your Vercel URL (including https://)
- Check Railway logs for CORS-related messages
- Ensure no trailing slash in `FRONTEND_URL`

### JWT Errors
- Ensure `JWT_SECRET` is at least 32 characters
- Verify the secret is the same across all instances
- Check that tokens aren't being cached with old secrets

### Application Won't Start
- Check Railway logs for error messages
- Verify all required environment variables are set
- Ensure `SPRING_PROFILES_ACTIVE=prod` is set
- Check that database schema exists (if using `validate` mode)

## Local Testing of Production Configuration

To test the production configuration locally:

```bash
# Set environment variables
export SPRING_PROFILES_ACTIVE=prod
export MYSQL_URL=jdbc:mysql://localhost:3306/nutrition_db
export MYSQL_USER=root
export MYSQL_PASSWORD=root
export JWT_SECRET=test-secret-key-at-least-32-characters-long
export FRONTEND_URL=http://localhost:5173

# Run the application
./mvnw spring-boot:run
```

## Security Notes

- Never commit secrets to Git
- Use Railway's environment variables for all sensitive data
- Rotate JWT_SECRET periodically
- Use strong database passwords
- Enable Railway's automatic SSL/TLS
- Consider enabling Railway's private networking for database

## Monitoring

Railway provides:
- Real-time logs
- Metrics dashboard
- Deployment history
- Automatic health checks

Access these from your Railway project dashboard.

## Rollback

If something goes wrong:
1. Go to Railway project → Deployments
2. Find the last working deployment
3. Click "Redeploy"

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Spring Boot Docs: https://spring.io/projects/spring-boot
