# FIX 3 — Small items left after re-checking FIX-1, FIX-2 and seed Phase 2

Do these **after** TASK-3 is finished and reported. Same rules as before (English base via i18n, identical styling, real data, local DB only, all suites green).

Verified OK on 2026-09-27 (local): backend starts; label PDF layout clean (no overlaps, QR ≥ 15 mm); several bags per parcel; voided / not-produced codes → `NOT_ISSUED_FOR_SALE`; scan without parcel → `VALIDATION_ONLY`; admin "Confirm bank payment" enabled for catalogue orders + "Reserved from marketplace stock"; Dispatch blocks missions without a quality-checked lot; buyer registration → pending message → admin notification → approval → buyer notification; `/register` redirect; mobile cart pack line + checkout creates the right order; Phase 2 ship → receive (wrong supplier rejected) → sell (double sale rejected) → plant → map "Bio Vera seed: 2 bags" → grower notification; supplier catalogue rejects free text.

## Items
1. **Mobile checkout summary line** (`mobile/features/buyer/checkout/BuyerCheckoutScreen.tsx`): a catalogue line shows "Jabuka – Ajdared × 4 kg — €19.20" while the cart is 4 × 5 kg = 20 kg / €84.00 (the total is correct). Show `4 × 5 kg (20 kg) — €84.00`.
2. **Mobile checkout address prefill**: fields start empty (only "Germany") although the buyer registered with an address. Prefill from the buyer profile like the web marketplace does (FIX-1 B4). Also the country default should come from the profile, not hardcoded "Germany".
3. **Mobile order detail** shows "20 kg × €4.20" for a catalogue order — show the pack (`4 × 5 kg · €21.00`) like web.
4. **Admin → Orders** row for catalogue orders still shows the old hint "Dodelite konkretnu zalihu u koloni proizvoda" / "Assign specific stock in the product column" under the status — hide it for catalogue orders (they're reserved from marketplace stock).
5. **`POST /auth/register/buyer`** returns an `access_token` for a `PENDING_VERIFICATION` account. It's unusable (every request returns 401 "Account is not active"), but don't issue it: return `{ status: 'PENDING_APPROVAL', message }` instead and make sure web/mobile registration screens don't try to log the user in.
6. **Recall dialog** (FIX-2 B1) and **Assign bags** preview/grower search (FIX-2 B2) — confirm they exist; if not, implement as described in FIX-2.
7. Report + all suites green.
