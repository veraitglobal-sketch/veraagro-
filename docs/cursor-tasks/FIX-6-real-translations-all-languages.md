# FIX 6 — Real translations for de / es / fr / ro / bg (web + mobile + glossary)

Measured on 2026-10-01 after commit 0e847c86. `scripts/i18n-check.cjs` exits 0, but the non-English files are mostly **English text copied into the key** — no key is "missing", yet the user still sees English:

| bundle | keys | identical to English |
|---|---|---|
| web `de` | 4813 | 2294 (47.7 %) + **131 keys missing** |
| web `es / fr / ro / bg` | 4813 | 2538–2590 (≈ 53 %) |
| mobile `de / es / fr / ro / bg` | 2864 | **2843 (99.3 %)** — practically untranslated |
| `shared/i18n/glossary` `de / es / fr / ro / bg` | 190 | 94–114 (50–60 %) — e.g. `missionStatus.logistics.IN_TRANSIT` = "In transit" in German |
| web `en` (base language) | — | **55 values are in Serbian** (e.g. `grower.appGuide.steps.*.detailBlocks.*`) |

Examples of English left in German files: `units.pallet` "pallet", `deliveryStatus.admin.CANCELLED` "Cancelled", `returnFlow.states.COLLECTED` "Collected from buyer", mobile `producer.estates.started` "Started", `producer.costCalculator.syncing` "Syncing…".

Same base rules (styling unchanged, local DB only, commit locally, no push).

## 1. Fix the guard first (so this can't pass again)
`scripts/i18n-check.cjs`:
- `ENGLISH_COPY_THRESHOLD` 0.85 → **0.05** for web and mobile; glossary stays 0.05. The check must actually `process.exit(1)` when exceeded (today the glossary is at 50–60 % with max 5 % and the script still exits 0 — find out why and fix it).
- Allow-list file `scripts/i18n-same-as-en.json` for strings that are legitimately identical (brand names "Bio Vera", "QR", "GPS", "EUR", "kg", "OK", e-mail placeholders…). Keep it short; every entry is a key, not a whole namespace.
- New check: the `en` file must not contain Serbian (`[čćšžđČĆŠŽĐ]`) except keys under `languagePage.locales.sr.*`. Move the 55 Serbian values from web `en.json` into `sr.json` and write the English text in `en.json`.
- Add the check to `npm test` of web and mobile (if not already) so CI fails.

## 2. Translate — order of work
Do it in batches by namespace, one commit per language per app, run the check after each batch:
1. **shared glossary** (190 keys × 5) — statuses, units, roles; this is what both apps show on every order/mission. Use the canonical terms from `shared/i18n/glossary.md`.
2. **mobile** (2864 keys × 5) — all screens: auth, buyer (shop, cart, checkout, orders, delivery), producer/grower (dashboard, estates, plantings, field log, planting entry, lots, packing, orders to prepare, missions), logistics, supplier, profile/settings, errors.
3. **web** (≈ 2550 keys × 5 + 131 missing in `de`) — buyer portal, marketplace, register/login/forgot/reset password, grower/producer portal, logistics portal, supplier, seed producer, admin, public passport/verify pages, plus the page bundles (`biovera-fresh-page`, `buyer-retail`, `grower-journey`, `passport-public`, `suppliers-page`, `pitch-deck`).

Quality rules (same as TASK-4 §3): natural professional language, agricultural/B2B terms consistent with the glossary; placeholders (`{{count}}`, `{{number}}`…), HTML/markdown and plural suffixes (`_one/_other`, and `_few/_many` where the language needs them — ro, bg, sr) identical in structure; Bulgarian in Cyrillic; no English words left in sentences. Legal pages: as in TASK-4 (don't invent legal text — keep English + "Available in English" note).

## 3. Acceptance
1. `node scripts/i18n-check.cjs` exits 0 with the new thresholds; report the identical-to-English % per bundle and language (expected < 5 % everywhere, only allow-listed keys).
2. Mobile switched to Deutsch: shop, cart, checkout, order detail, grower home, field log, planting entry, orders to prepare, logistics missions, supplier seed stock — **no English text** (screenshots or page text).
3. Web `/de/`, `/fr/`, `/bg/`: buyer portal orders + marketplace, grower dashboard, logistics missions, admin orders — no English text.
4. Web `en` contains no Serbian text.
5. All suites green, commit locally, no push.
