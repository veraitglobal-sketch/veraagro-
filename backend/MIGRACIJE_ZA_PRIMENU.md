# 📋 Migracije koje treba primeniti

## ✅ Već primenjene migracije:
1. `20260131160209_init` - Osnovna inicijalna migracija
2. `20260131192938_add_compliance_log_model` - Compliance log model
3. `20260131203107_add_security_scraped_discount_models` - Security alerts, discount quota, scraped prices

## ⚠️ Migracije koje treba primeniti:

### 1. **Vera Insights** (NOVA)
**Fajl:** `20250201140000_add_vera_insights/migration.sql`

**Šta dodaje:**
- Enum `RiskLevel` (LOW, MEDIUM, HIGH)
- Enum `PriceTrend` (UP, DOWN, STABLE)
- Tabela `vera_insights` sa svim poljima
- Foreign keys ka `seeds` i `users` tabelama
- Indexi na `cropName`, `isActive`, `veraScore`

**Status:** ✅ Kreirana, ali **NISU primenjena** na bazu

---

### 2. **Digital Handover & Disputes** (NEDOSTAJE)
**Problem:** Tabele `digital_handovers` i `disputes` ne postoje u bazi, ali postoje u schema.prisma

**Šta treba dodati:**
- Enum `HandoverStatus` (INITIATED, IN_PROGRESS, COMPLETED, DISPUTED)
- Enum `QualityStatus` (FRESH, DAMAGED)
- Tabela `digital_handovers`
- Tabela `disputes`
- Foreign keys

**Status:** ❌ Nedostaje migracija

---

### 3. **Plot Blueprints** (NEDOSTAJE)
**Problem:** Tabela `plot_blueprints` ne postoji u bazi, ali postoji u schema.prisma

**Šta treba dodati:**
- Tabela `plot_blueprints`
- Foreign key ka `parcels` tabeli

**Status:** ❌ Nedostaje migracija

---

### 4. **HandoverStatus Enum Konflikt** (PROBLEM)
**Problem:** U init migraciji postoji `HandoverStatus` sa vrednostima:
- PENDING, APPROVED, REJECTED, BLOCKED

Ali u schema.prisma imamo:
- `LogisticsHandoverStatus` sa: PENDING, APPROVED, REJECTED, BLOCKED
- `HandoverStatus` sa: INITIATED, IN_PROGRESS, COMPLETED, DISPUTED

**Rešenje:** 
- Enum iz init migracije treba preimenovati u `LogisticsHandoverStatus`
- Kreirati novi `HandoverStatus` enum sa novim vrednostima

**Status:** ⚠️ Potrebna korekcija

---

## 📝 Plan akcije:

### Korak 1: Primeni Vera Insights migraciju
```bash
cd backend
npx prisma migrate deploy
```

### Korak 2: Kreiraj migraciju za Digital Handover
```bash
npx prisma migrate dev --name add_digital_handover_disputes --create-only
```

### Korak 3: Kreiraj migraciju za Plot Blueprints
```bash
npx prisma migrate dev --name add_plot_blueprints --create-only
```

### Korak 4: Popravi HandoverStatus enum konflikt
- Preimenuj postojeći enum u `LogisticsHandoverStatus`
- Dodaj novi `HandoverStatus` enum

---

## ⚠️ VAŽNO:

**Pre primene migracija:**
1. Backup baze podataka
2. Proveri da li postoje podaci u `logistics_handovers` tabeli koji koriste stari `HandoverStatus`
3. Ako postoje, migriraj ih pre promene enum-a

**Nakon primene:**
1. Verifikuj da su sve tabele kreirane
2. Testiraj da Prisma Client radi ispravno
3. Testiraj backend endpoint-e
