# BioVera Web App – Review & Gaps

## Critical issues (fix first)

### 1. Missing /coordinator route → 404
- **Problem:** Navigation links COORDINATOR users to `/coordinator`, but no page exists
- **Impact:** Users with COORDINATOR role get 404 when clicking Dashboard
- **Fix:** Create `/app/coordinator/page.tsx` or redirect COORDINATOR to `/admin` (if they share admin features)

### 2. 401 redirect always goes to /login/producer
- **Problem:** In `lib/api.ts`, all 401 responses redirect to `/login/producer`
- **Impact:** BUYER users who session-expire are sent to producer login (confusing but same form)
- **Note:** Same login form works for all roles; UX could be improved with role-aware redirect

### 3. Inconsistent API base URL fallbacks
- **Current mix:** `localhost:3000`, `localhost:3001`, `localhost:3004`
- **Main api.ts:** uses 3004
- **Fix:** Standardize on one port (e.g. 3004) in all fallbacks when `NEXT_PUBLIC_API_URL` is unset

### 4. Login redirect does not go to role dashboard
- **Problem:** After login, users land on `/` (or returnTo), not their dashboard
- **Impact:** Extra click to open Dashboard
- **Improvement:** Redirect GROWER → /grower, BUYER → /buyer-portal, etc. after login

---

## Medium priority

### 5. Fleet partner dashboard – mock data
- **Location:** `/fleet-partner`, `/fleet-partner/missions`, etc.
- **Status:** Uses hardcoded data (no API integration)
- **Impact:** Fleet partners see placeholder content
- **Same pattern as logistics dashboard before MVP:** wire to real APIs when ready

### 6. FLEET_PARTNER not in Navigation
- **Problem:** No Dashboard link for FLEET_PARTNER role in Navigation
- **Impact:** Fleet partners may not have clear entry point if they log in
- **Fix:** Add FLEET_PARTNER → `/fleet-partner` in getDashboardLink

### 7. Producer vs grower routes
- **`/grower`** – main grower dashboard (with AuthGuard)
- **`/producer/dashboard`** – producer dashboard
- **`/producer/scanner`** – scanner
- **Note:** GROWER and FARMER both go to /grower. Producer routes may be legacy or mobile-oriented. Confirm intended usage.

### 8. Logistics handover API port
- **Location:** `logistics-partner/handover/page.tsx`
- **Current:** Fallback `localhost:3001` (others use 3004)
- **Fix:** Align with `NEXT_PUBLIC_API_URL` / 3004

---

## Lower priority / nice-to-have

### 9. Sitemap – add more pages
- Could add: `/for-buyers`, `/investors`, `/protocol-360` (already present), `/faq`

### 10. Error boundary message
- Error page says "Our team has been notified" – may not be true if no error reporting service is configured

### 11. Loading states
- Some pages could use clearer skeleton/loading UX during API calls

### 12. Offline support
- `lib/offline/` exists – ensure it’s wired where needed per .cursorrules

---

## What’s solid

- Auth flow and token handling
- AuthGuard for protected routes
- not-found and error pages
- Cookie consent
- Layout, Navigation, Footer
- Logistics dashboard MVP with real API
- Localization standardized to English
- Help Center and Protocol 360 simplified (no DE)

---

## Recommended action order

1. Add `/coordinator` page or redirect COORDINATOR to `/admin`
2. Standardize API URL fallbacks to one port
3. Add post-login redirect to role-specific dashboard
4. Optionally add FLEET_PARTNER to Navigation and fix handover API port
