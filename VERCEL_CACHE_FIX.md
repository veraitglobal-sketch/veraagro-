# Vercel Build Cache Fix

## Problem
Vercel build error shows:
```
Module not found: Can't resolve '@/hooks/useAuth'
```

But the file is already fixed to use `@/lib/auth` in the repository.

## Solution: Clear Vercel Build Cache

### Option 1: Clear Cache via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Open your project: https://vercel.com/dashboard
   - Click on your project

2. **Go to Settings**
   - Click on **"Settings"** tab
   - Scroll down to **"Build & Development Settings"**

3. **Clear Build Cache**
   - Find **"Clear Build Cache"** button
   - Click it
   - Confirm the action

4. **Redeploy**
   - Go to **"Deployments"** tab
   - Click **"Redeploy"** on the latest deployment
   - Or push a new commit to trigger redeploy

### Option 2: Force Redeploy with Empty Commit

If Option 1 doesn't work, force a new deployment:

```bash
git commit --allow-empty -m "chore: Force Vercel redeploy to clear cache"
git push origin main
```

### Option 3: Check Root Directory

Make sure Vercel is using the correct root directory:

1. Go to **Settings** → **General**
2. Check **"Root Directory"**
3. Should be set to: `web`
4. If not, change it and save

### Option 4: Verify Build Settings

1. Go to **Settings** → **Build & Development Settings**
2. Check:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (or leave empty for auto-detect)
   - **Output Directory**: `.next` (or leave empty for auto-detect)
   - **Install Command**: `npm install` (or leave empty)

## Verification

After clearing cache and redeploying:
- Check build logs - should not show the `@/hooks/useAuth` error
- Build should complete successfully
- Deployment should be live

## Why This Happens

Vercel caches build artifacts to speed up deployments. Sometimes the cache contains old code that hasn't been updated, causing build errors even though the repository is correct.
