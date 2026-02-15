# Bio Vera – Legal Document Structure

**Reference for Terms & Conditions and Database Organisation**

---

## Level 1: Legal Documentation

| Item | Description |
|------|-------------|
| **Identity & KYC** | Personal identification, ID/passport upload, verification |
| **Land & Property Rights** | BPG number, land registry, lease agreements |
| **Digital Contract Signing** | Electronic acceptance of Terms & Conditions, binding agreement |

---

## Level 2: Pre-Harvest (Growing)

| Item | Description |
|------|-------------|
| **Approved Input List (Whitelist)** | Catalogue of permitted substances, MRL compliance |
| **Field Logs & GPS Stamping** | Real-time treatment records, location verification |
| **Weather & Soil Monitoring** | Environmental data collection and tracking |

---

## Level 3: Harvest

| Item | Description |
|------|-------------|
| **Hygiene & Sanitation** | Handwashing stations, toilets, sanitation proof |
| **Worker Training & Welfare** | Daily briefings, health declarations, labour standards |
| **Batch Generation & Labeling** | Batch creation, QR codes, traceability labels |

---

## Level 4: Logistics & Quality (Export)

| Item | Description |
|------|-------------|
| **Cold Chain (HACCP Monitoring)** | Temperature logs, CCP entries, transport compliance |
| **Lab Testing & Sealing** | Quality verification, laboratory results |
| **Crisis Management (Recall System)** | Recall procedures, traceability for withdrawals |

---

## Usage in Application

- **Registration flow:** Require scroll-to-end + "I Accept" for Terms & Conditions (Level 1).
- **Database:** Organise collections as `Growers` (Level 1), `FieldOperations` (Levels 2–3), `Logistics` (Level 4).
- **Compliance:** Each level maps to specific checklist items and validation rules in the Platform.
