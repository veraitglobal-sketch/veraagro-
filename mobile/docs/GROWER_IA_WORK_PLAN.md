# Grower mobile — plan rada (redosled + Cursor promptovi)

**Scope:** samo `mobile/`, grower/producer.  
**Cilj:** jedan mentalni model — 5 tabova, jedan ulaz po ekranu, bez mrtvog koda.  
**Referenca:** `docs/GROWER_MOBILE_IA_REDESIGN.md`, `mobile/docs/MOBILE_SCROLL_BUDGET.md`

---

## Pravila pre svake faze

- Jedna faza = jedan PR / jedan chat (ne mešati).
- Posle svake faze: `cd mobile && npx tsc --noEmit`.
- Ne dirati backend, buyer, supplier osim ako faza eksplicitno ne kaže.
- i18n: uvek `en.json` + `sr.json` zajedno.

---

## Faza 0 — Mapa navigacije (read-only, 30 min)

**Zašto prvo:** svi sledeći refaktori oslanjaju se na jednu istinu „tab → hub → stack“.

**Cursor prompt:**

```
Radimo SAMO mobile/. Read-only + jedan novi fajl.

Kreiraj mobile/docs/GROWER_NAV.md:
- Tabela: 5 tabova → hub fajl → stack rute koje otvaraju
- Lista skrivenih tabova (href: null) + ko ih otvara
- Lista mrtvih/orphan ruta (certifications, shop redirect, BatchesListScreen…)
- Mermaid dijagram: Početna → Polje → Lanac → Nabavka → Profil
- Farmer workflow: 7 koraka Polje + 7 koraka Lanac (predlog)

NE menjaj kod osim novog MD fajla.
```

**Done kada:** dokument postoji, tim može da ga koristi bez čitanja koda.

---

## Faza 1 — Cleanup mrtvog koda (nizak rizik, 1 h)

**Zašto drugo:** smanjuje buku pre UX refaktora; nema promene ponašanja.

**Cursor prompt:**

```
Radimo SAMO mobile/, grower/producer.

Obriši ili spoji mrtav kod (proveri grep pre brisanja):
1. features/grower/batches/BatchesListScreen.tsx — nije importovan; obriši
2. features/grower/dashboard/FarmerHomeSection.tsx — nije importovan; obriši
3. features/grower/dashboard/FinancialSummarySection.tsx — nije importovan; obriši
4. features/grower/dashboard/LiveInformationSection.tsx — nije importovan; obriši
5. features/grower/dashboard/RecentActivitySection.tsx — nije importovan; obriši

Proveri da nema broken importa. tsc --noEmit u mobile/.

NE diraj BatchesScreen, BatchDetailScreen, API.
```

**Done kada:** tsc čist, grep ne nalazi reference na obrisane fajlove.

---

## Faza 2 — Profil: IA bez duplikata (srednji rizik, 1–2 h)

**Zašto treće:** QuickAccessGrid ruši hub model; sertifikati su unreachable.

**Cursor prompt:**

```
Radimo SAMO mobile/features/grower/profile/ i i18n.

1. QuickAccessGrid — ukloni stavke koje već žive u tab hubovima:
   UKLONI: estates, batches, missions, orders, materials, growthJournal
   OSTAVI max 3: settings, education, notifications (ili samo settings + education)

2. ProducerProfileScreen — dodaj EnterpriseNavSection "Nalog i usklađenost":
   - Sertifikati → /(producer)/(tabs)/certifications
   - Zabranjene supstance → /(producer)/(tabs)/banned-substances
   - Novčanik → /(producer)/wallet (već WalletCard)

3. i18n ključevi producer.profile.sectionCompliance (en + sr)

tsc --noEmit. NE diraj hub ekrane.
```

**Done kada:** Profil nema duplikate Lanac/Polje/Nabavka; certifications i banned-substances dostupni iz UI.

---

## Faza 3 — Polje hub: dopuna (srednji rizik, 2 h)

**Zašto četvrto:** Polje je novi 7-korak UI ali nedostaju plantings, offline metrika, i18n header.

**Cursor prompt:**

```
Radimo SAMO mobile/features/grower/hubs/FieldHubScreen.tsx + i18n.

Zadrži 7 kartica u radnom redosledu farmera. Dopuni:

1. Header preko i18n (ne hardkodiraj "Polje"):
   producer.hubs.field.screenTitle, producer.hubs.field.screenSubtitle

2. Dodaj 8. karticu ILI zameni "Parcele" opis — plantings:
   Ikona: Sprout ili Calendar
   Naslov: producer.hubs.field.workflow.plantingsTitle
   Ruta: /(producer)/plantings
   (dodaj i18n ključeve)

3. Opciono: jedna linija statusa ispod headera iz GrowerDashboardContext
   (parcelSteps.pending/approved) — bez punog HubMetricsStrip

4. Pull-to-refresh: useGrowerTabRefresh (kao Chain hub)

5. Kartice 1 i 2: estates ostaje; parcele kartica može router.push
   '/(producer)/estates' sa query ?focus=parcels ako postoji, inače ostavi isto

Font min 13px, theme iz lib/theme.ts, inline styles kao sada.

NE diraj Chain hub. tsc --noEmit.
```

**Done kada:** Polje ima i18n, refresh, plantings link, status linija.

---

## Faza 4 — Lanac hub: simetrija sa Poljem (srednji rizik, 2–3 h)

**Zašto peto:** Lanac je referenca ali stari pattern; Polje i Lanac treba da izgledaju isto.

**Cursor prompt:**

```
Radimo SAMO mobile/features/grower/hubs/ChainHubScreen.tsx (+ novi fajl po potrebi).

Refaktoriši Lanac tab na ISTI pattern kao FieldHubScreen:
- ScrollView, inline styles, theme
- Header: i18n producer.hubs.chain.screenTitle + screenSubtitle
- 7 kartica u radnom redosledu POSLE žetve:

  1. Lotovi → /(producer)/batches (Package)
  2. Novi lot → /(producer)/batch-new (Plus) — ili Plus u headeru kao batches
  3. Pakovanje → /(producer)/packing-flow (Camera)
  4. Kvalitet → /(producer)/quality-entry (ClipboardCheck)
  5. Usklađenost foto → /(producer)/compliance-photos (Camera)
  6. Prevoz → /(producer)/missions (Truck)
  7. Nalepnice / skener → /(producer)/package-badges (QrCode)

Kartice: ~72px, ikona 44x44 primaryLight, chevron desno, gap 12.

Ukloni HubMetricsStrip i BioVeraChainTraceStrip sa tab roota
(scroll budget: tab root = navigacija, ne dashboard).

Zadrži useGrowerTabRefresh. i18n en + sr.

NE diraj batch detail, packing-flow logiku, API.
```

**Done kada:** Polje i Lanac vizuelno i strukturalno par.

---

## Faza 5 — Nabavka hub: eksplicitni linkovi (nizak rizik, 1 h)

**Cursor prompt:**

```
Radimo SAMO mobile/features/grower/hubs/SuppliesHubScreen.tsx + i18n.

1. Dodaj eksplicitnu karticu "Partner porudžbine" → /(producer)/partner-orders
2. Proveri da products i cost-calculator imaju jasne ulaze
3. Uskladi shell sa Field/Chain ako Faza 4 završena (iste kartice stil)

tsc --noEmit. NE diraj partner-order detail.
```

---

## Faza 6 — Wallet: jedan izvor podataka (srednji rizik, 2 h)

**Cursor prompt:**

```
Radimo SAMO mobile/contexts/ i grower ekrane koji čitaju wallet.

Problem: /wallets/me se fetchuje u GrowerDashboardContext I WalletContext.

1. WalletContext = jedini owner wallet + transactions + ordersFinancial
2. useDashboardData — ukloni dupli wallet fetch (financialData ako ne koristi niko)
3. Home KPI / Profil — čitaju iz WalletContext ili dashboard samo ordersFinancial summary

Pažljivo: offline, refresh on pull. tsc --noEmit.
Test: Profil wallet card + WalletScreen + Home teaser.
```

---

## Faza 7 — Skriveni tabovi i legacy rute (nizak rizik, 1 h)

**Cursor prompt:**

```
Radimo SAMO mobile/app/(producer)/(tabs)/.

1. (tabs)/shop.tsx — proveri grep za deep link; ako nema, obriši i ukloni iz _layout
2. (tabs)/wallet.tsx — dokumentuj zašto redirect postoji ILI prebaci sve na stack /wallet
3. U GROWER_NAV.md ažuriraj stavke posle promena

NE diraj buyer routes.
```

---

## Faza 8 — seed-registration pod producer shell (opciono, visok rizik)

**Samo ako treba GPS/auth konzistentnost.**

```
Premesti /seed-registration u /(producer)/seed-registration
Global route ostavi kao redirect 1 release.
Ažuriraj Field hub link i grower-journey mobilePath u shared/.
```

---

## Redosled izvršavanja (sažetak)

| # | Faza | Rizik | Trajanje | Blokira |
|---|------|-------|----------|---------|
| 0 | GROWER_NAV.md mapa | Nema | 30m | — |
| 1 | Mrtav kod | Nizak | 1h | — |
| 2 | Profil IA | Srednji | 1–2h | — |
| 3 | Polje dopuna | Srednji | 2h | — |
| 4 | Lanac simetrija | Srednji | 2–3h | Faza 3 (pattern) |
| 5 | Nabavka linkovi | Nizak | 1h | Faza 4 (stil) |
| 6 | Wallet context | Srednji | 2h | — |
| 7 | Legacy tabovi | Nizak | 1h | Faza 0 |
| 8 | seed-registration | Visok | 2h | opciono |

**Preporučeni MVP (jedan sprint):** 0 → 1 → 2 → 3 → 4  
**Drugi sprint:** 5 → 6 → 7  
**Kasnije:** 8

---

## Definition of Done (ceo plan)

- [x] Farmer: svaki ekran dostupan iz tačno jednog tab hub-a (ili Početna next-step)
- [x] Polje + Lanac + Nabavka: isti UI pattern, radni redosled kartica
- [x] Profil: nema duplikata hub menija
- [x] Nema mrtvih list screen fajlova
- [x] GROWER_NAV.md ažuriran
- [x] `mobile/` tsc čist
- [x] SR default: hub tab roots preko i18n
- [x] seed-registration pod producer shell (faza 8)

---

*Kreirano: 2026-05-25 — za interne Cursor sesije.*
