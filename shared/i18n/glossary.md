# Bio Vera shared glossary

Canonical domain vocabulary for **web + mobile** (7 languages). Source JSON: `shared/i18n/glossary/<lang>.json`.  
Runtime helpers: `shared/i18n/labels.ts` (`orderStatusLabel`, `deliveryStatusLabel`, `missionStatusLabel`, …).

## Serbian canonical wording (Latin)

| Concept | Buyer-facing (sr) | Admin / ops (sr) | Notes |
|---------|-------------------|------------------|-------|
| Order PENDING | Poslato | Na čekanju | Buyer = order submitted |
| Order APPROVED | Prihvaćeno | Odobreno | **Different** audience labels |
| Order IN_TRANSIT | U transportu | U transportu | Same everywhere |
| Delivery DELIVERED | Dopremljena — čeka prijem | Isporučeno | Buyer waits for receipt |
| Mission READY_FOR_LOADING | — | Spremno za utovar | Logistics handover gate |
| Field diary | Poljski dnevnik | Poljski dnevnik | Replaces “Recent entries (this device)” |

## Order status (`orderStatus`)

| Code | EN buyer | SR buyer | SR admin |
|------|----------|----------|----------|
| PENDING | Placed | Poslato | Na čekanju |
| APPROVED | Accepted | Prihvaćeno | Odobreno |
| IN_TRANSIT | In transit | U transportu | U transportu |
| DELIVERED | Delivered | Isporučeno | Isporučeno |

Full matrix in JSON for all 7 languages.

## Web ↔ mobile fixes (TASK-4)

| Issue | Web before | Mobile before | Fix |
|-------|------------|---------------|-----|
| Buyer order status | Hardcoded English in `web/lib/buyer-order-status.ts` | `buyer.orders.statuses.*` per-page keys | `orderStatusLabel(t, status, 'buyer')` from shared glossary |
| Mission status | `adminPages.missions.statuses.*` | mixed logistics keys | `missionStatusLabel(t, status, 'admin' \| 'logistics')` |
| Delivery status | `buyerPortalDeliveries.deliveryStatus_*` | `buyerDeliveryStatus.*` | `deliveryStatusLabel(t, status, 'buyer')` |
| SR APPROVED | Odobreno (admin pages) | Prihvaćeno (buyer) | Explicit `orderStatus.buyer` vs `orderStatus.admin` |
| SR IN_TRANSIT | U tranzitu (web admin) | U transportu (mobile buyer) | Canonical **U transportu** everywhere |
| Languages | Web 7, mobile 2 | — | Mobile `supportedLngs` = 7; picker matches web endonyms |
| User language | Not stored | AsyncStorage only | `users.preferredLanguage` + PATCH `/users/me` |
| Notifications | English-only strings | — | `templateKey` + `templates/<lang>.json`, rendered per `preferredLanguage` |

## Nouns (examples)

| Key | en | sr | de |
|-----|----|----|-----|
| nouns.estate | Farm | Gazdinstvo | Betrieb |
| nouns.fieldDiary | Field diary | Poljski dnevnik | Feldtagebuch |
| nouns.marketplace | Marketplace | Tržište | Marktplatz |

See JSON files for complete enum coverage (seed bag, handover, roles, units, …).
