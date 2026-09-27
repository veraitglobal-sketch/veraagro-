# Which env vars does the Vercel (frontend) project actually need?

The **web app** (Next.js on Vercel) only reads a few environment variables. If you have 20–30 in Vercel, the rest are likely leftovers, duplicates, or from backend/docs.

---

## Required for production

| Variable | Used for | Example value |
|----------|----------|----------------|
| `NEXT_PUBLIC_API_URL` | All API calls (login, orders, passport, admin, grower, etc.) | `https://biovera-production.up.railway.app` or your backend URL |

Without this, the site will call `localhost` and nothing will work in production.

---

## Optional (have defaults in code)

| Variable | Used for | Default in code |
|----------|----------|------------------|
| `NEXT_PUBLIC_SITE_URL` | Schema.org, metadata, sitemap, robots | `https://biovera.app` |
| `NEXT_PUBLIC_BASE_URL` | Logout redirect (api/logout) | `http://localhost:3001` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Map embed on transparency batch page | `'YOUR_API_KEY'` (so optional unless you use that map) |

You can leave these unset and the app will still run with the defaults, or set them for correctness (e.g. `NEXT_PUBLIC_SITE_URL` = `https://biovera.app`).

---

## Set automatically by Vercel (do not add manually)

- `NODE_ENV` (production / preview)

---

## Total: 1 required, 3 optional

So for the **Vercel** project you only need:

1. **`NEXT_PUBLIC_API_URL`** – your production backend URL.

Optionally:

2. **`NEXT_PUBLIC_SITE_URL`** = `https://biovera.app`  
3. **`NEXT_PUBLIC_BASE_URL`** = `https://biovera.app` (for logout redirect)  
4. **`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`** – only if you use the map on the transparency batch page.

---

## Who added the rest (20–30)?

- **You or a teammate** during setup, or copied from a full `.env.example`.
- **Backend vars by mistake** – e.g. `SMTP_*`, `RESEND_*`, `JWT_SECRET`, `FRONTEND_URL`, `OPENAI_API_KEY`, `OPENWEATHER_*` are for the **backend** (Railway etc.), not for Vercel. Putting them in Vercel doesn’t break anything but they’re not used by the frontend.
- **Integrations** – e.g. Vercel Analytics, Speed Insights, or other add-ons can add their own vars.
- **Duplicate entries** – same name in Production, Preview, Development so they count 2–3 times.

You can safely **remove** from Vercel any variable that is not in the list above (after making sure you have `NEXT_PUBLIC_API_URL` set). Keep only what the frontend needs; backend secrets stay on Railway/backend host.
