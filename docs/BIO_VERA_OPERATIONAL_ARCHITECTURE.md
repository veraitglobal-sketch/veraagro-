# Bio Vera Operational Architecture

**Document Structure Reference for Terms & Conditions and Database Design**

---

## Document Hierarchy (Level 1–4)

### Level 1: Legal Documentation
- Identity & KYC
- Land & Property Rights
- Digital Contract Signing

### Level 2: Pre-Harvest (Growing)
- Approved Input List (Whitelist)
- Field Logs & GPS Stamping
- Weather & Soil Monitoring

### Level 3: Harvest
- Hygiene & Sanitation
- Worker Training & Welfare
- Batch Generation & Labeling

### Level 4: Logistics & Quality (Export)
- Cold Chain (HACCP Monitoring)
- Lab Testing & Sealing
- Crisis Management (Recall System)

---

## Pillar 1: Legal Dossier & Geospatial Identification

**Goal:** Absolute traceability – every crate has a "birth address".

### Article 1.1: KYC (Know Your Grower)
- **Personal data:** First name, last name, national ID number (JMBG/ID), residential address
- **Documentation:** Mandatory upload of ID card photograph (both sides) or passport
- **Verification:** System blocks progression to the next step until AI confirms image is readable

### Article 1.2: Farm Status
- **BPG Number:** Entry of unique agricultural holding registration number
- **Land registry extract:** Digital copy of registration resolution (not older than 6 months)
- **Lease agreement:** If parcel is not owned, mandatory PDF/photograph of lease contract with clearly defined expiry date

### Article 1.3: Digital Parcel Map
- **GPS Polygon:** User must walk parcel boundaries. Application records coordinates and calculates exact area (m²)
- **Satellite Validation:** System automatically retrieves satellite imagery of the location as proof that fruit cultivation exists at those coordinates

---

## Pillar 2: Phytomedical Protocol (Whitelist)

**Goal:** 0.00% unauthorized substances. Input control before sprayer starts.

### Article 2.1: Approved Substances Catalogue
- **Database:** Import list of active substances permitted in the EU (e.g. Azoxystrobin within MRL limits)
- **Restriction:** Farmer cannot enter treatment if the product is not on the list

### Article 2.2: Treatment Record (Digital Log)
- **Timestamping:** Spraying entry must be in real time. GPS confirms farmer was on parcel at time of entry
- **Details:** Product name, dosage (e.g. 2 L/ha), water consumption, reason for spraying (e.g. grey mould protection)
- **Safety Period (PHI):** System automatically blocks "Harvest" option until the legally defined number of days for that product has elapsed

---

## Pillar 3: HACCP Field Hygiene

**Goal:** Prevention of contamination (Norovirus, Hepatitis A, E. coli).

### Article 3.1: Field Infrastructure
- **Sanitation point:** Photograph of handwashing station (water, soap, towel)
- **Toilets:** Confirmation of toilet presence within 200 m of harvest site

### Article 3.2: Worker Hygiene
- **Daily briefing:** Farmer photographs picker group before work starts
- **Health declaration:** Each picker (or farmer on their behalf) confirms they have no symptoms of diarrhoea, vomiting, or purulent sores on hands

### Article 3.3: Packaging
- **Log:** Confirmation that crates are new or disinfected. Direct placement of crates on soil is prohibited (must be on pallets or supports)

---

## Pillar 4: Logistics & Cold Chain

**Goal:** Berries must not "overheat" – freshness maintained to Germany.

### Article 4.1: Pick-up (Handover)
- **Thermal status:** Measurement of fruit temperature at truck loading (target: below 10°C before transport in refrigerated unit)
- **Quantity record:** Digital scale linked to app (or manual entry with photograph of scale display)

### Article 4.2: Transport Log
- **CCP (Critical Control Point):** Driver enters refrigerated compartment temperature every 4 hours via app
- **Proof:** Photograph of thermocontroller from cab with visible timestamp

---

## Database Architecture (Implementation Reference)

```
Collection: Growers
  └── Pillar 1 (Legal Dossier & Geospatial Identification)
  └── KYC data, farm status, parcel maps

Collection: FieldOperations
  └── Pillar 2 (Phytomedical Protocol)
  └── Pillar 3 (HACCP Field Hygiene)
  └── Whitelist usage, treatment logs, hygiene checklists

Collection: Logistics
  └── Pillar 4 (Logistics & Cold Chain)
  └── Pick-up records, temperature logs, transport CCP data

Function: ReportGenerator
  └── Generates PDF containing all above data in certificate format
```

---

## Code Structure Recommendations

| Component | Location | Purpose |
|-----------|----------|---------|
| Pillar 1 models | `users`, `estates`, `kyc_verifications`, `land_documents` | KYC, farm status, parcel polygons |
| Pillar 2 models | `bio_white_list`, `field_entries`, `treatment_logs` | Whitelist, spraying records, PHI blocking |
| Pillar 3 models | `hygiene_checklists`, `compliance_photos`, `worker_declarations` | Sanitation, health declarations |
| Pillar 4 models | `deliveries`, `temperature_logs`, `ccp_entries` | Cold chain, CCP monitoring |
| ReportGenerator | `backend/src/reports/` or `operational-manual/` | PDF/certificate export |
