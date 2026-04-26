# Outstanding product / tech (tracked)

*Last pass: 2026-04-26*

## B2B: porudžbine proizvođača (grower) ↔ snabdevač

| Area | Status | Notes |
|------|--------|--------|
| Backend: direktan order + store bez `mapApproved` | Done | Javna mapa i dalje `mapApproved`; direktan link radi. |
| Web: *Where to buy* + stranica prodavnice | Done | `growerNav` |
| **Web: moje B2B porudžbine + thread-ovi** | **Done (2026-04-26)** | `growerSupplierB2bAPI` + `/grower/partner-orders` + `/grower/partner-orders/thread/[id]`. |
| **Mobile: lista B2B porudžbina + thread-ova** | **Done (2026-04-26)** | `b2bSuppliersAPI.getMyDirectOrders` + `getMyThreadsAsFarmer` + ekran `/(producer)/partner-orders` + CTA sa Home. |
| **Mobile: brzi ulaz** | **Improved** | `partner-orders` + link na `map` na ekranu; i dalje nije tab (namerno). |
| `mobile/lib/api.ts` `b2bSuppliersAPI` | Done (2026-04-26) | Uklonjen duplikat `postMessage` u istom objektu. `getMessages` / `getThreadMessages` i dalje dupliraju GET; može se ujediniti kasnije. |

## Ostalo (iz ranijih niti)

| Item | Status |
|------|--------|
| Prisma `migrate deploy` P3009 (failed `20260505130000_missions_harvest_announcement`) | DB-specific; vidi `backend/scripts/repair-missions-harvest-migration.sql` + `prisma migrate resolve` |
| Offline sync / field-entries 403 | Delimično adreseovano (estateId, validacije) — proveriti na stvarnom nalogu |
| Pallet / logistics handover (ako je bila zasebna niti) | Proveri da li je u branchu kompletno u odnosu na backend |

*Ažuriraj ovu tabelu kada nešto zatvoriš (ili obriši red).*
