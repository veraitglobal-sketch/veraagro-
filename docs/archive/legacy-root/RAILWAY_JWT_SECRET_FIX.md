# Railway JWT_SECRET Fix

## Problem
The backend deployment shows "successful" but then crashes with:
```
JwtStrategy requires a secret or key
```

## Solution
You **MUST** add the `JWT_SECRET` environment variable in Railway.

## Steps to Fix:

### 1. Go to Railway Dashboard
- Open your Railway project
- Click on your backend service

### 2. Add Environment Variable
- Click on the **"Variables"** tab
- Click **"+ New Variable"**
- Add:
  - **Name**: `JWT_SECRET`
  - **Value**: Generate a secure random string (see below)

### 3. Generate JWT_SECRET
You can use one of these methods:

**Option A: Use OpenSSL (recommended)**
```bash
openssl rand -base64 32
```

**Option B: Use Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option C: Use an online generator**
- Go to https://generate-secret.vercel.app/32
- Copy the generated secret

### 4. Add Other Required Variables
Make sure you also have these variables set in Railway:

- `JWT_SECRET` - **REQUIRED** (the one causing the crash)
- `DATABASE_URL` - Your PostgreSQL connection string
- `PORT` - Usually `3000` or Railway will auto-assign
- `NODE_ENV` - Set to `production`
- `FRONTEND_URL` - Your Vercel frontend URL (e.g., `https://biovera.app`)
- `SMTP_HOST` - Your email SMTP host
- `SMTP_PORT` - Your email SMTP port (usually `587` or `465`)
- `SMTP_USER` - Your email SMTP username
- `SMTP_PASS` - Your email SMTP password
- `EMAIL_FROM` - Your sender email (e.g., `info@biovera.app`)
- `ADMIN_EMAIL` - Admin email (e.g., `info@biovera.app`)

### 5. Redeploy
After adding `JWT_SECRET`:
- Railway will automatically redeploy
- Or click **"Redeploy"** button manually
- Wait for the deployment to complete

### 6. Verify
Check the logs:
- Go to **"Deployments"** tab
- Click **"View logs"** on the latest deployment
- You should see the app starting successfully without the JWT error

## Why This Happens
The `JwtStrategy` needs a secret key to verify JWT tokens. Without it, the authentication system cannot work, and the app crashes on startup.

## Quick Checklist
- [ ] Added `JWT_SECRET` to Railway Variables
- [ ] Generated a secure random string (32+ characters)
- [ ] Added all other required environment variables
- [ ] Redeployed the service
- [ ] Checked logs - no more JWT errors
