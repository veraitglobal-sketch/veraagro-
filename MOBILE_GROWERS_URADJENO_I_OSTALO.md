# 📱 BioVera Mobile – Growers: šta je urađeno, šta treba da se uradi

Samo **growers (producer)** deo aplikacije. Referenca: `MOBILE_ARCHITECTURE_PLAN.md`, `MOBILE_STA_OSTALO_I_DALJE.md`.

---

## 1. Šta je urađeno (growers)

### 1.1 Offline i sync

| Stavka | Status |
|--------|--------|
| Pending proizvodi (QR + ručni) u AsyncStorage | ✅ |
| Pending troškovi u AsyncStorage | ✅ |
| Pending certificate photos (foto sertifikata) | ✅ |
| Pending field entries (rad na njivi) | ✅ |
| Sync servis šalje sve na server kad ima mreže | ✅ |
| Indikator u headeru: „Sačuvano u telefonu: X“ / „Sve poslato“ | ✅ |

### 1.2 Tabovi i navigacija

| Tab / ekran | Ruta | Feature modul | Status |
|-------------|------|----------------|--------|
| Home (Dashboard) | `(tabs)/index.tsx` | `features/grower/dashboard/` | ✅ |
| Moji proizvodi | `(tabs)/products.tsx` | `features/grower/products/` | ✅ |
| Kalkulator troškova | `(tabs)/cost-calculator.tsx` | `features/grower/cost-calculator/` | ✅ |
| Field log (Journal) | `(tabs)/field-log.tsx` | `features/grower/field-log/` | ✅ |
| Sertifikacije | `(tabs)/certifications.tsx` | `features/grower/certifications/` | ✅ |
| Zabranjena sredstva | `(tabs)/banned-substances.tsx` | `features/grower/banned-substances/` | ✅ |
| Profile | `(tabs)/profile.tsx` | – | ✅ |
| Settings | `(tabs)/settings.tsx` | – | ✅ |
| Wallet | `(tabs)/wallet.tsx` | `features/grower/wallet/` | ✅ |
| Harvest | skriven tab / link | `features/grower/harvest/` | ✅ |
| Shop | uklonjen za growers (redirect na Moji proizvodi) | – | ✅ |

### 1.3 Stack – liste i detalji (refaktor u feature)

| Ekran | Ruta | Feature modul | Status |
|-------|------|----------------|--------|
| Detalj misije | `mission/[id].tsx` | `features/grower/missions/` | ✅ |
| Detalj porudžbine | `orders/[id].tsx` | `features/grower/orders/` | ✅ |
| Detalj batch-a | `batch/[id].tsx` | `features/grower/batches/` | ✅ |
| Lista misija | `missions.tsx` | – | ✅ (ekran postoji) |
| Lista porudžbina | `orders.tsx` | – | ✅ |
| Lista batch-eva | `batches.tsx` | – | ✅ |
| Lista njiva / estate | `estates.tsx`, `estates/` | – | ✅ (ekran postoji) |

### 1.4 Ostali growers ekrani (refaktor u feature)

| Ekran | Ruta | Feature modul | Status |
|-------|------|----------------|--------|
| Quality entry | `quality-entry.tsx` | `features/grower/quality-entry/` | ✅ |
| Materials (whitelist) | `materials.tsx` | `features/grower/materials/` | ✅ |
| Plot mapper | `plot-mapper.tsx` | `features/grower/plot-mapper/` | ✅ |
| Growth journal | `growth-journal.tsx` | `features/grower/growth-journal/` | ✅ |
| Vera insights | `vera-insights.tsx` | `features/grower/vera-insights/` | ✅ |
| Vera bag | `vera-bag.tsx` | `features/grower/vera-bag/` | ✅ |
| Scanner | `scanner.tsx` | – (jedan fajl) | ✅ (radi, TS ispravljen) |
| Notifications | `notifications.tsx` | – | ✅ (ekran postoji) |

### 1.5 Arhitektura i build

| Stavka | Status |
|--------|--------|
| Tanki screen fajlovi u `app/(producer)/` – delegiraju na feature | ✅ za sve refaktorisane |
| Feature moduli u `features/grower/<naziv>/` | ✅ dashboard, products, cost-calculator, certifications, banned-substances, field-log, harvest, missions, orders, batches, **quality-entry**, **materials**, plot-mapper, growth-journal, vera-insights, vera-bag, wallet |
| TypeScript bez grešaka (`npx tsc --noEmit`) | ✅ |
| Build (`npx expo export --platform ios`) | ✅ prolazi |
| Integrity: barcode validacija, GPS (field log, harvest) | ✅ gde je planirano |

---

## 2. Šta treba da se uradi (growers)

### 2.1 Refaktor – ekrani preko ~300 linija

| Fajl | Linije (okvirno) | Šta uraditi |
|------|-------------------|-------------|
| `(producer)/compliance-photos.tsx` | ~333 | Opciono: izvući u `features/grower/compliance-photos/` (i eventualno offline queue kao field log). |
| `(producer)/estates.tsx` | ~337 | Opciono: refaktor u feature ako lista/detalj naraste. |
| `(producer)/scanner.tsx` | ~346 | Opciono: podela na ScannerView + ResultHandler ili ostaviti kao jedan fajl. |

**quality-entry** i **materials** refaktor su urađeni (tanki wrapper u `app/`, logika u `features/grower/quality-entry/` i `features/grower/materials/`).

Liste `batches.tsx`, `missions.tsx`, `orders.tsx`, `notifications.tsx` su na granici (~290–315 linija); refaktor po potrebi.

### 2.2 Funkcionalno – provera / dopuna

| Oblast | Šta proveriti ili uraditi |
|--------|----------------------------|
| **Compliance photos** | Da li postoji offline queue + sync kao za field log; ako treba konzistentno – dodati. |
| **Quality entry** | Da li šalje na backend / offline-first po potrebi (refaktor urađen). |
| **Materials** | Već ima offline cache; refaktor u feature urađen. |
| **Estates** | Provera da lista i detalj rade kako treba. |
| **Notifications** | Lista i „mark as read“ – provera da radi. |

### 2.3 Opciono (kasnije)

| Stavka | Napomena |
|--------|----------|
| Wallet – detaljniji prikaz | Transakcije, isplate, po potrebi. |
| Estates – feature modul | Ako želimo konzistentno sve u `features/grower/estates/`. |
| Compliance photos – offline queue | Ako želimo isto ponašanje kao field log. |

---

## 3. Pregled u dve tabele

### Urađeno (growers)

- Offline storage i sync za proizvode, troškove, certificate photos, field entries.  
- SyncStatus u headeru.  
- Svi tabovi (Moji proizvodi, Kalkulator, Sertifikacije, Zabranjeno, Field log, Harvest, Profile, Settings, Wallet). Shop uklonjen (redirect).  
- Refaktor u feature: dashboard, products, cost-calculator, certifications, banned-substances, field-log, harvest, missions, orders, batches, **quality-entry**, **materials**, plot-mapper, growth-journal, vera-insights, vera-bag, wallet.  
- Liste: missions, orders, batches, estates – ekrani postoje.  
- Scanner, notifications, compliance-photos – ekrani postoje.  
- TS i build čisti.

### Ostalo (growers)

- Refaktor (opciono): compliance-photos, estates, scanner.  
- Funkcionalno: provera compliance photos (offline), quality entry (flow), materials (samo refaktor), estates, notifications.  
- Opciono: wallet detaljnije, estates u feature, compliance offline queue.

---

*Ažurirano u skladu sa stanjem projekta (growers deo).*
