# Unapređenja stranica i povezivanja (novi backlog)

**Povezano:** detaljan prioritetizovan backlog posle finansija/escroua — [`FOLLOWUP_BACKLOG_DETAILED.md`](FOLLOWUP_BACKLOG_DETAILED.md).

**Svrha:** Zasebna lista od [`WEB_MOBILE_CHANNEL_PARITY_PLAN.md`](WEB_MOBILE_CHANNEL_PARITY_PLAN.md) — fokus na tome da svaka stranica ima **smislen tok** (linkovi, CTAs, ista ruta gde treba, prevod gde korisnik očekuje), a ne samo „isti API“.

**Legenda:** 🟢 gotovo u kodu · 🟡 u toku / delimično · 🔴 nije početo · **?** treba provera u browseru

---

## P0 — Konfuzne ili podeljene rute (grower / producer)

| # | Problem | Predlog | Status |
|---|---------|---------|--------|
| P0.1 | Sidebar growera i dashboard sada dele **jedan kanon**: **`/grower/fields`** za liste/dodavanje; kartice sa početne vode na **`?estate=id`** (scroll na blok). | — | 🟢 |
| P0.2 | **`next.config.ts`**: trajni redirect **`/producer/estates`**, **`/new`**, **`/:id`** → **`/grower/fields`** (sa query za id). | — | 🟢 |
| P0.3 | **`GrowerOfflineOutboxBanner`**: link na terenski unos **`/producer/field-entry`** bez pogrešnog `loc()` prefiksa. U **`grower-nav`** dodata stavka **`grower.nav.fieldCapture`** (isto, raw path). | — | 🟢 |

---

## P1 — Javni sajt, footer, cross-locale

| # | Problem | Predlog | Status |
|---|---------|---------|--------|
| P1.1 | **Footer:** „Za logistiku“ → **`/logistics-partner`** namerno **bez** `loc()` (app ruta je locale-free kao `/grower`). Komentar u kodu. | — | 🟢 |
| P1.2 | **Footer:** bedževi postaju **`<a>`** kada su u env postavljeni **`NEXT_PUBLIC_IOS_APP_STORE_URL`** / **`NEXT_PUBLIC_ANDROID_PLAY_STORE_URL`**; inače ostaju neklikabilni span. Vidi **`web/.env.example`**. | Popuniti env u prod kad listing postoji. | 🟢 |
| P1.3 | **Kontakt / FAQ / Press:** UI je kroz `t()`; poruka uspeha na kontaktu je **`contactPage.successMessage`**; **press** `useMemo` zavisi od **`i18n.language`** da bi se pri `/sr` osvežio `returnObjects` sadržaj; **server `generateMetadata`** (`contact/faq/press` **layout.tsx** + **`lib/marketing-page-meta.ts`**) za naslov/tab i SEO po jeziku. | Smoke: `/sr/contact`, `/sr/faq`, `/sr/press` + pojedinačno saopštenje. | 🟢 |
| P1.4 | **Vision / roadmap:** na **`web/app/[locale]/page.tsx`** postoje **`id="vision"`** i **`id="roadmap"`** (`scroll-mt-24`); footer **`loc('/')#...`** je u redu. | — | 🟢 |

---

## P2 — Uloge i unutrašnji dashboard-i (web)

| # | Problem | Predlog | Status |
|---|---------|---------|--------|
| P2.1 | **Admin / supplier / logistics** — lokalizacija. | **Supplier:** **Poruke** / **Porudžbine** — `supplier.messagesPage*`, `supplier.ordersPage*`, `supplier.orderStatusB2B.*`, `dateIntlLocaleFromLanguageTag`. **Logistics-partner:** `handover` / `handover-receiver` — `logisticsPages.*`. **Admin:** **`/admin/vera-insights`** — `adminPages.veraInsights.*`; **`/admin/users`** — `adminPages.userManagement.*`; **`/admin/missions`** — `adminPages.missions.*`; **`/admin/orders`** — `adminPages.orderManagement.*` + datumi. Ostali admin ekrani — isti obrazac po potrebi. | 🟡 |
| P2.2 | **Buyer portal** vs **buyer shop** — matrica u parity planu; proveriti da li svi „nazad u portal“ / „u korpu“ linkovi vode na kanonske rute posle redirecta. | Ručni prolaz + eventualno dodatni redirect za preostale legacy `/buyer/*`. | 🟡 |
| P2.3 | **Notifikacije na webu** — da li svaka stavka u `NotificationCenter` ima smislen `actionUrl` i da li se poklapa sa mobilnim mapperom (`resolve-notification-action`). | Uskladiti poruke backenda + frontend fallback. | ? |

---

## P3 — Mobilni: povezivanje ekrana i preostali engleski

| # | Problem | Predlog | Status |
|---|---------|---------|--------|
| P3.1 | Tab bar: **Home, Steps, Products, Profile** — ostatak toka je na stacku. **mob-3:** producer/logistics/supplier neautentifikovani redirect sada ide na **`/login?partner=1`** (isti UI kao univerzalni login); ruta **`/partner-login`** ostaje kao kompatibilni alias. | Mapa „ekran A → back → tab X“ za buyer/logistics/supplier/producer. | 🟡 |
| P3.2 | **Producer** stack: ekrani kao **`missions-create`**, **`notifications`**, **`growth-journal`** — grep na `toLocale*` bez locale i na JSX sa fiksnim engleskim. | Nastavak Q3 iz parity plana; prioritet ekrani sa najviše korisnika. | 🟡 |
| P3.3 | **Deep link / notifikacija** otvara pogrešan tab ili 404 ako je korisnik multi-role. | Test matrix: jedan nalog, više uloga; edge cases u `resolveNotificationActionHref`. | ? |

---

## P4 — Podaci i „prazni“ tokovi (UX, ne samo link)

| # | Problem | Predlog | Status |
|---|---------|---------|--------|
| P4.1 | Lista ili detalj učitavaju podatke, ali **prazan state** nema CTA ka sledećem koraku (npr. nema narudžbina → link ka shopu ili partner porudžbinama). | Po jedan primarni CTA po ulozi u glavnim listama. | 🔴 |
| P4.2 | **API greške** prikazane kao sirovi string sa backenda — korisnik nema „šta dalje“. | **Grower web (2026-05):** `growerApiErrorOrT` + lokalizovani fallback na ključnim stranicama; misija „create“ više ne ispisuje HTTP+JSON telo; modal detalja partije prikazuje grešku učitavanja. Ostale uloge / kanali — nastaviti po istom obrascu. | 🟡 |
| P4.3 | **Plot / batch / passport / farmer** — jedan kanon za QR, grower fields i copy. | **Referenca:** § *Javni URL šabloni* ispod; smoke: `/plot/{publicCode}`, `/passport/{batchId}`. | 🟡 |

---

## Javni URL šabloni (web, P4.3)

**Cilj:** Isti path u poljima growera, admin test ekranima, buyer panelu i u QR payloadima; apsolutni link za deljenje: **`NEXT_PUBLIC_BASE_URL`** ili **`NEXT_PUBLIC_SITE_URL`** (web) / **`EXPO_PUBLIC_SITE_URL`** (mob) — vidi **`web/.env.example`** i **`mobile/.env.example`**.

| Namena | Kanon ruta | Parametar | Napomena |
|--------|------------|-----------|----------|
| Javni pasoš partije (lot) | `/passport/[batchId]` | Javni `batchId` npr. `BATCH-…` | `web/app/passport/[batchId]/page.tsx` |
| Javna stranica parcele | `/plot/[code]` | `parcel.publicCode` | `web/app/plot/[code]/page.tsx`; API `GET /parcels/public/plot/:code` |
| Javni profil proizvođača | `/farmer/[farmerQrCode]` | QR iz profila | `grower/profile`, `grower` dashboard — često `origin + path` |
| Marketing „Protocol 360“ | `/protocol-360` | — | `web/app/protocol-360/page.tsx`; sitemap ga uključuje |

**Locale:** Grower shell (`/grower/*`) i ove javne rute su u praksi **bez** prefiksa jezika kao ostale app rute; marketing koristi `/[locale]/…` gde postoji — pri generisanju linkova u mejlu koristiti isti obrazac kao na sajtu.

**Kod referenca:** link na plot sa liste parcela — `web/app/grower/fields/page.tsx` (`href={/plot/${publicCode}}`); QR parcela — `web/lib/api.ts` (komentar uz retail PNG).

---

## Kako održavati ovu listu

1. Kada nešto uradite — promenite status u tabeli i po potrebi dodajte red (kratko, jedna ideja po ćeliji „Problem“).
2. Kanalni paritet (env, socket, CI) ostaje u **`WEB_MOBILE_CHANNEL_PARITY_PLAN.md`**.
3. Širi funkcionalni TODO po modulima: **`TODO_WEB_MOBILE.md`** u korenu repozitorijuma.

**Poslednji sync (docs):** grower `/grower/portal` koristi mapirane poruke i milestone ključeve; mobilni grower login ujedinjen preko `/login?partner=1` — vidi taj plan i `partnerSignInHref` u `mobile/lib/post-login-redirect.ts`.

---

## Brza provera (audit komandi)

```bash
# Hardkodovani producer putevi na grower površinama
rg '/producer/' web/app/grower web/components/grower --glob '*.tsx'

# Mobilni producer: mogući fiksni engleski u JSX (grubo)
rg "<Text[^>]*>\\s*[A-Z]" mobile/app/(producer) --glob '*.tsx' | head -40

# Web: duži stringovi u JSX bez t( (grubo, ima lažnih pozitiva)
rg ">[A-Z][a-z]+ [a-z]+" web/app --glob '*.tsx' | head -40
```

---

*Kreiran kao novi backlog za unapređenje povezivanja stranica; ažurirati status po iteracijama.*
