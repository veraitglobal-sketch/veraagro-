# Vercel Cache Clear - Critical Fix

## Problem
Vercel build error shows:
```
Module not found: Can't resolve '@/hooks/useAuth'
```

But the file `web/app/grower/profile/page.tsx` is **already fixed** in the repository to use `@/lib/auth`.

## Solution: Force Clear Vercel Cache

### Step 1: Clear Build Cache in Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Open: https://vercel.com/dashboard
   - Click on your project

2. **Go to Settings**
   - Click **"Settings"** tab
   - Scroll to **"Build & Development Settings"**

3. **Clear Build Cache**
   - Find **"Clear Build Cache"** button
   - Click it
   - Confirm the action

### Step 2: Verify Root Directory

1. In **Settings** → **General**
2. Check **"Root Directory"**
3. Should be: `web`
4. If not, change it and save

### Step 3: Force Redeploy

**Option A: Via Dashboard**
- Go to **"Deployments"** tab
- Click **"Redeploy"** on the latest deployment
- Select **"Use existing Build Cache"** = **OFF** (unchecked)

**Option B: Via Empty Commit (Already Done)**
- Empty commit has been pushed to trigger redeploy
- Vercel should automatically detect and redeploy

### Step 4: Verify Deployment

After redeploy:
1. Check build logs
2. Should NOT show `@/hooks/useAuth` error
3. Build should complete successfully

## Why This Happens

Vercel caches build artifacts aggressively. Even though the code is correct in the repository, Vercel may be using cached build files that contain the old import path.

## Verification

The file is correct in the repository:
```typescript
// web/app/grower/profile/page.tsx
import { useAuth } from '@/lib/auth';  // ✅ Correct
```

No files in the codebase use `@/hooks/useAuth` anymore.

## If Still Failing

If the error persists after clearing cache:

1. **Check Branch**
   - Make sure Vercel is building from `main` branch
   - Settings → Git → Production Branch = `main`

2. **Check Build Command**
   - Settings → Build & Development Settings
   - Build Command should be: `npm run build` (or empty for auto-detect)

3. **Check Environment Variables**
   - Make sure all required env vars are set
   - Especially `NEXT_PUBLIC_API_URL`

4. **Contact Support**
   - If still failing, contact Vercel support
   - Reference this issue: "Build cache not clearing despite code fix"
