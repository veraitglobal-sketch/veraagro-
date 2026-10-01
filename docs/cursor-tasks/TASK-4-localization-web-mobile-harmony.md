# TASK 4 — One language system and one vocabulary for web + mobile

> Read the whole file first. Implement section by section (1 → 7), verify each, then report. Same base rules as all previous tasks: English is the base language, styling unchanged, real data only, **local DB only** (`DATABASE_URL="postgresql://jovicamihajlovic@localhost:5432/biovera_db"` — `backend/.env` points to production), never run migrations against production, all suites green, commit locally (no push).

## Why
The web site supports **7 languages** (`en, sr, de, es, fr, ro, bg` — `web/i18n/config.ts`), the mobile app only **2** (`en, sr` — `mobile/i18n/config.ts`). Even on the web, `de/es/fr/ro/bg` are only half translated. The same thing is called differently on web and mobile, and backend notifications/e-mails are English-only because the user's language is not stored. Web and mobile must behave as **one product**: same languages, same words for the same thing, same fields and rules for the same data.

### Measured state (2026-10-01)
| | keys | notes |
|---|---|---|
| web `en.json` / `sr.json` | 4760 / 4752 | + page bundles `biovera-fresh-page`, `buyer-retail`, `grower-journey`, `passport-public`, `suppliers-page`, `pitch-deck` (per language) |
| web `de.json` | 2498 | ~2260 missing → fall back to English |
| web `es/fr/ro/bg.json` | 2332 each | ~2430 missing |
| mobile `en.json` / `sr.json` | 2851 / 2851 | + `grower-journey.*`, `grower-season.*` (en/sr only) |
| mobile `de/es/fr/ro/bg` | — | not supported at all |

Same status, different Serbian words (examples found):
| Value | Web (sr) | Mobile (sr) |
|---|---|---|
| `APPROVED` | Odobreno | Prihvaćeno |
| `IN_TRANSIT` | U tranzitu | U transportu |
| `PENDING` | Na čekanju | Na čekanju / Poslato |
| `CONFIRMED` | Potvrđeno | Potvrđeno / U pripremi / Prijem potvrđen |
| `DELIVERED` | Isporučeno | Isporučeno / Dopremljena — čeka prijem |

## 1. Shared vocabulary (single source of truth)
Create `shared/i18n/` (the `shared/` package already exists and is used by mobile via `../../shared/...`):
- `shared/i18n/glossary/<lang>.json` for all 7 languages — **domain terms and every enum label** used by both apps:
  - order status (`PENDING, APPROVED, PAID, CONFIRMED, PICKED_UP, IN_TRANSIT, DELIVERED, COMPLETED, CANCELLED, REFUNDED`) — note: buyer-facing wording may differ from admin wording; define both explicitly as `orderStatus.buyer.*` and `orderStatus.admin.*` instead of ad-hoc per-page keys;
  - delivery status, mission status (incl. `AWAITING_APPROVAL`, `READY_FOR_LOADING`), handover status, return/refund status;
  - catalog product status, stock movement types, pack/unit words (kg, g, pack, bag, crate, pallet);
  - seed bag status (`LABELED … RECALLED, PARTIALLY_USED`), seed run status, custody events;
  - roles (Buyer, Grower, Logistics partner, Supplier, Seed producer, Admin), field-entry types (SETVA, …), quality grades, market channels;
  - common nouns: farm/estate, parcel, lot/batch, planting, harvest plan, mission/run, delivery, receiving code, handover, marketplace, catalogue.
- `shared/i18n/glossary.md`: the canonical table (term → en / sr / de / es / fr / ro / bg) for humans and translators.
- Make **web** import from `shared/` (configure `transpilePackages`/`experimental.externalDir` or a path alias in `web/next.config.*` + `web/tsconfig.json`; verify `next build` and Vercel build with Root Directory `web` still work — if Vercel can't see `../shared`, add a prebuild copy step and document it).
- Both apps merge the glossary into their i18n resources under a `glossary` namespace (or `common.*`) and **every status badge / enum label in both apps must come from it**. Remove the duplicated per-page status keys (e.g. `adminPages.missions.statuses.*`, `buyerPortalOrders…`, mobile `buyer.orders.statuses.*`, `logistics.delivery.status.*`, `buyerDeliveryStatus.*`) and replace usages with shared helpers: `orderStatusLabel(t, status, audience)`, `missionStatusLabel`, `deliveryStatusLabel`, `seedBagStatusLabel`, … in `shared/i18n/labels.ts`.
- Decide canonical Serbian wording once (and document it in glossary.md), e.g. `APPROVED` buyer = "Prihvaćeno", admin = "Odobreno"; `IN_TRANSIT` = "U transportu" everywhere.

## 2. Same languages in the mobile app
- `mobile/i18n/config.ts`: `supportedLngs` = the same 7 as web; base/fallback `en`. Add `mobile/i18n/locales/{de,es,fr,ro,bg}.json` (+ `grower-journey.*`, `grower-season.*` for each).
- Language picker in mobile Settings / Profile shows the same list and native names as the web `LanguageSwitcher` (English, Srpski, Deutsch, Español, Français, Română, Български). First launch: use the device language if supported, else English; saved choice wins (existing `lib/i18n-language.ts`).
- Dates/numbers/currency: one helper per app driven by the active language (`Intl` with the right locale; EUR formatting; kg with locale decimal separator). Same output on web and mobile for the same value.

## 3. Complete all translations
- Web: fill every missing key for `de, es, fr, ro, bg` (≈2300–2400 each) including the page bundles.
- Mobile: full `de, es, fr, ro, bg` for all keys (≈2850 each).
- Quality rules: natural professional language, agricultural/B2B terminology consistent with the glossary; keep placeholders (`{{count}}`, `{{number}}`, …) and HTML/markdown identical; no machine-translation artefacts like untranslated English words in the middle of a sentence; Serbian in Latin script; Bulgarian in Cyrillic.
- Legal pages (terms, privacy, cookies) — translate only if they already exist in that language on the web; otherwise keep English and show "Available in English" note (do not invent legal text).

## 4. Store the user's language and localize notifications/e-mails
- Add `users.preferredLanguage String? @default("en")` (migration). Set it: at registration (from the app/site language), when the user changes language in web or mobile (`PATCH /users/me { preferredLanguage }`), and on login if empty.
- Notifications: stop storing English sentences only. Store `templateKey` + `params` (JSON) on `notifications` (keep `title`/`message` columns filled with the **rendered text in the recipient's language** for backward compatibility). Create backend templates `backend/src/notifications/templates/<lang>.json` for all existing notification types (orders, catalogue, transport, delivery, handover, seed, supplier, buyer approval, producer). Push notifications use the same rendered text.
- E-mails (`backend/src/email/email.service.ts`): render subject/body in the recipient's `preferredLanguage` with English fallback.
- Public pages that show backend text (`/s/<serial>` instructions are admin content — leave as entered; passport/verify labels come from the web i18n).

## 5. Same data, same rules on web and mobile
Audit every entity that can be created or edited in **both** apps and make fields, required flags, validation, units and wording identical. At minimum:
| Entity | Web | Mobile |
|---|---|---|
| Buyer registration (incl. company + delivery address) | `/register/buyer` | `buyer-register` |
| Grower registration / farm / parcel | grower pages | estates / plot mapper |
| Buyer company profile + delivery locations | `/buyer-portal/profile` | buyer profile |
| Marketplace order (pack + count + address) | `/buyer-portal/marketplace` | shop → cart → checkout |
| Order status timeline + rejection reason | `/buyer-portal/orders` | order detail |
| Delivery receiving code + handover + receipt | `/buyer-portal/deliveries`, handover | BuyerDeliveryPanel, manager/handover-complete |
| Harvest plan / planting / field diary entries | admin + grower portal | harvest hub, field log, planting entry |
| Logistics mission actions (claim, driver, handover, lifecycle, receiving code entry) | `/logistics-partner/*` | `(logistics)/*` |
| Supplier catalogue (approved products only) + seed bag receive/sell | `/supplier/*` | `(supplier)/*` |
| Seed scan results / bag origin card | admin lookup, `/s/` | seed registration, planting entry |
- Put shared validation in `shared/` (e.g. `shared/validation/*.ts`: address, phone, quantities, pack counts, temperature 2–8 °C, serial format) and use it in both apps; backend DTOs keep the authoritative validation and must match.
- Use the same enum values and the same API endpoints/payloads from both apps (no app-specific shapes). List any differences you find and fix them; report the list.

## 6. Guards (so it stays consistent)
- `scripts/i18n-check.cjs` (repo root) run in CI and `npm test` of web/mobile: fails if any key in `en` is missing in another supported language (web + mobile + glossary), if placeholders differ, or if a value is identical to English in a non-English locale for more than N% of keys (report list).
- ESLint rule / simple check that new UI strings are not hardcoded in TSX (allow-list for brand names).
- Unit tests for `shared/i18n/labels.ts` (every enum value has a label in all 7 languages).

## 7. Acceptance
1. Mobile language picker offers the same 7 languages as the web; switching to Deutsch translates every mobile screen (spot-check: shop, cart, checkout, order detail, planting entry, field diary, logistics missions, supplier seed stock).
2. Web in `de`, `es`, `fr`, `ro`, `bg`: no English fallback text on buyer portal, marketplace, admin products/supply/orders/seed production, producer portal, logistics portal (`i18n-check` reports 0 missing).
3. The same order shows the **same status words** on web buyer portal, mobile order detail, admin orders, logistics portal — in every language.
4. A Serbian-language buyer receives "Porudžbina prihvaćena…" (in Serbian) as in-app notification, push and e-mail; a German-language grower receives German notifications.
5. A buyer registers on mobile → the same company/address fields appear and are editable on the web profile, and vice versa.
6. All suites green; `scripts/i18n-check.cjs` passes; report includes the list of web↔mobile differences found and how each was fixed.
