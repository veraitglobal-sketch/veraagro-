# E2E smoke: transport od growera do završetka (misija)

**Svrha:** Jedan proverljiv tok koji spaja **grower web**, **admin panel**, **logistiku (web/app)** i **grower portal** (praćenje). Koristi isti backend kontrakt.

**Preduslovi (dev / staging):**

- Nalog **grower** sa gazdinstvom, **PACKED** ili **QUALITY_VERIFIED** lotom, **compliance** (fotke + label roll) gde standard to zahteva.
- (Opciono) `MISSIONS_REQUIRE_CONFIRMED_HARVEST_PLAN=false` ako još nemate potvrđen berbanski plan.
- Aktivan **LOGISTICS_PARTNER** sa najmanje jednim **AVAILABLE** vozilom sa **hasFrigo**.
- Admin: `SUPER_ADMIN` ili `ADMIN`.

---

## 1. Grower — zahtev za transport

| Korak | Gde | Provera |
|--------|-----|--------|
| 1.1 | Web: `/grower/missions/create` | Izaberi lot, GPS, adresa preuzimanja → submit. Očekivano: **201** ili **400** sa čitljivom porukom (ne 500). |
| 1.2 | API | `POST /missions` sa `batchId`, `pickupLocation`, `pickupAddress`. Odgovor sadrži `id`, `missionNumber`, `status` (**PENDING** ako nije auto-dodela). |
| 1.3 | Web: `/grower/portal` | Nova misija u listi; deep link `?missionId=<uuid>` otvara detalj. |

---

## 2. Admin — dodela partnera (ili preskoči ako logistika “claim”-uje)

| Korak | Gde | Provera |
|--------|-----|--------|
| 2.1 | Web: `/admin/missions` | Filter **PENDING** / „Samo PENDING, bez vozača”; **Dodeli vozača** → partner + (opciono) vozilo. |
| 2.2 | API | `PATCH /missions/admin/:id/assign` body: `logisticsPartnerId`, opciono `vehicleId`. Misija → **ASSIGNED**; partner dobija notifikaciju. |

**Alternativa (bez admin koraka):** partner pozove `POST /missions/:id/claim` → **ASSIGNED** (prvo slobodno frigo vozilo).

---

## 3. Logistika — prihvatanje

| Korak | Gde | Provera |
|--------|-----|--------|
| 3.1 | Web: `/logistics-partner/missions` ili mobilni ekvivalent | Misija **ASSIGNED** za ovaj nalog. |
| 3.2 | API | `PUT /missions/:id/accept` (LOGISTICS_PARTNER) → **ACCEPTED**. |

---

## 4. Grower — kvalitet (ako lot još nema quality entry)

| Korak | Gde | Provera |
|--------|-----|--------|
| 4.1 | `/grower/quality-entry` ili mobilni | Quality entry **COMPLETED** za lot; batch **QUALITY_VERIFIED** gde proces to postavi. |

*Rupa u toku:* handover API zahteva završen quality entry na lotu pre utovara.

---

## 5. Logistika — loading handover (foto + temperatura + potpis)

| Korak | Gde | Provera |
|--------|-----|--------|
| 5.1 | Web handover / app ekran koji zove API | Slanje `logisticsHandover` (pallet + enterijer kamiona + bedž + potpis + driver + temp u opsegu). |
| 5.2 | API | Endpoint iz `quality-entry` modula za **LogisticsHandover** — misija mora biti u **ASSIGNED**, **ACCEPTED** ili **IN_PROGRESS** (pre odlaska sa farme); ne **COMPLETED** / **CANCELLED**. Posle uspeha: red u `logistics_handovers`, misija → **READY_FOR_LOADING**. |

---

## 6. Logistika — lifecycle (odlazak sa farme → tranzit → isporuka)

| Korak | API | Očekivani statusi |
|--------|-----|-------------------|
| 6.1 | `PATCH /missions/:id/lifecycle` body `{ "step": "DEPART_FARM" }` | **READY_FOR_LOADING** → **PICKED_UP**, postavi `pickedUpAt`. |
| 6.2 | Isti endpoint `step`: **START_TRANSIT** | **PICKED_UP** → **IN_TRANSIT**. |
| 6.3 | Isti endpoint `step`: **COMPLETE_DELIVERY** | **IN_TRANSIT** → **COMPLETED**, `completedAt`. |

---

## 7. Grower — portal (mapa / milepostoni)

| Korak | Gde | Provera |
|--------|-----|--------|
| 7.1 | `/grower/portal?missionId=…` | Milepostoni se ažuriraju (handover, odlazak, tranzit, završetak) u skladu sa statusima gore. |

---

## Brza checklista (jedna linija)

`POST /missions` (grower) → `PATCH …/admin/…/assign` *ili* `POST …/claim` → `PUT …/accept` → (quality ako treba) → **handover** → `DEPART_FARM` → `START_TRANSIT` → `COMPLETE_DELIVERY` → provera **portala**.

---

## Šta je urađeno u repou uz ovaj dokument

- Admin **filter statusa** uključuje **READY_FOR_LOADING** i **CANCELLED** (puna slika toka u `/admin/missions`).
- **Logistics handover** odbija završene/otkazane misije i status van „dodeljeno, još uvek na farmi“ (vidi `QualityEntryService.logisticsHandover`).

Ažuriraj ovaj fajl kada se menja state machine ili rute.
