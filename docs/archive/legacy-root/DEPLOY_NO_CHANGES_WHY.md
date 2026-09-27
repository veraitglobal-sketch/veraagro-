# Why biovera.app doesn’t show changes until you “re-add” the site

## What you see

- You deploy to the **existing** project (biovera.app) → **no visible changes** on the site.
- When you **“re-add” the site** (e.g. new deployment, or re-connect / new project) → **all changes appear**.

## Why this happens (most likely)

### 1. **Vercel build cache (most common)**

- Vercel **caches** the result of `npm install` and the build (e.g. `.next`) to speed up deploys.
- A normal **Redeploy** often **reuses this cache**, so it can keep serving an **old build** even though the code in Git is new.
- When you **“re-add”** the site (new project or re-connect repo), there is **no cache** yet, so you get a **full clean build** and see all changes.

So: **same repo, but “existing” deploy = cached build, “re-add” = clean build.**

### 2. **Production domain still points to an old deployment**

- **Production** (e.g. biovera.app) is attached to **one specific deployment**.
- If that deployment is **old**, the live site won’t show new changes even if newer deployments exist.
- “Re-adding” can end up linking the domain to a **new** deployment, so you suddenly see the new version.

### 3. **Browser / CDN cache**

- Your browser or Vercel’s edge cache can show an **old HTML/JS** for a while.
- A **new** URL (e.g. new deployment URL like `xxx.vercel.app`) has no cache, so it shows the latest version.

---

## What to do so the existing site (biovera.app) updates

You don’t need to “re-add” the site every time. Do this on the **existing** project:

### Step 1: Clear build cache and redeploy (recommended)

1. **Vercel Dashboard** → your project (the one connected to biovera.app).
2. **Settings** → **General** (or **Build & Development Settings**).
3. Find **“Clear Build Cache”** (or similar) and run it.
4. Go to **Deployments**.
5. On the **latest** deployment, open **“...”** → **“Redeploy”**.
6. If Vercel asks **“Redeploy with or without cache?”**, choose **“Redeploy without using cache”** (or “Clear cache and redeploy”).
7. Wait for the build to finish.

After that, **biovera.app** should serve this new deployment. If production is set to “auto” from the main branch, it will already point to it.

### Step 2: Make sure production uses the new deployment

1. **Deployments** → find the deployment that just finished (green check).
2. Check that it has the **Production** badge (or that **biovera.app** is assigned to it).
3. If not: **“...”** on that deployment → **“Promote to Production”** (or assign the domain to it).

### Step 3: Hard refresh the site

- Open **https://www.biovera.app** (or https://biovera.app).
- Do a **hard refresh**: e.g. **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac).
- Or open the site in an **Incognito/Private** window so the browser doesn’t use old cache.

---

## Optional: force a clean deploy from Git (no “re-add” needed)

If you prefer to trigger a **new** deployment from code (and then clear cache on that deploy):

```bash
cd web   # or your repo root if Vercel builds from root
git add .
git commit -m "chore: trigger redeploy"
git push origin main
```

Then in Vercel: open that **new** deployment → **“...”** → **“Redeploy”** and choose **“Redeploy without using cache”** (if the option exists). That way the **existing** project and **biovera.app** get the new build without re-adding the site.

---

## Short summary

| Situation | Reason |
|----------|--------|
| Deploy on **existing** project → no changes | Cached build or production still on old deployment. |
| **Re-add** site → changes appear | New project/deploy = no cache, or domain points to new deploy. |

**Fix:** On the **existing** Vercel project, **clear build cache** and **Redeploy without cache**, then **promote that deployment to Production** and **hard refresh** biovera.app. After that, normal deploys to the same project should show changes without needing to re-add the site.
