# Railway Builder Fix - Switch to Dockerfile

## Problem
Railway was using **NIXPACKS** builder instead of Dockerfile:
- Nixpacks uses Debian Bookworm (12) by default
- Bookworm doesn't have `libssl1.1` package
- Dockerfile with Bullseye was being ignored

## Solution
Changed `railway.json` to use **DOCKERFILE** builder:

**Before:**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build && npx prisma generate"
  }
}
```

**After:**
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  }
}
```

## What This Does
- Railway will now use the `Dockerfile` in the `backend` directory
- Dockerfile uses `node:20-bullseye` which has OpenSSL 1.1.x
- `libssl1.1` package will be available

## Next Steps
1. Railway will automatically redeploy with Dockerfile builder
2. Build should now use Bullseye (not Bookworm)
3. `libssl1.1` should install successfully
4. Prisma should work without OpenSSL errors

## Verification
After deployment, check Railway build logs:
- ✅ Should see "bullseye" in package repository URLs
- ✅ `libssl1.1` should install successfully
- ✅ Build should complete
- ✅ Prisma should load without errors

## Alternative: Manual Railway Settings
If `railway.json` doesn't work, change in Railway Dashboard:
1. Go to **Settings** → **Build**
2. Change **Builder** from "Nixpacks" to **"Dockerfile"**
3. Save and redeploy
