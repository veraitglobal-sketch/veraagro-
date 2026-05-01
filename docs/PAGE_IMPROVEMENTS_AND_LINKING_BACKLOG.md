# Unapređenja stranica i povezivanja (novi backlog)

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
| P1.3 | **Kontakt / FAQ / Press** na `/sr/…` — istorijski problem engleskog sadržaja uz srpski izbor jezika. | Završiti `useTranslation` + `sr.json` na tim stranicama; smoke na `biovera.app/sr/contact`, `/sr/faq`, `/sr/press`. | 🟡 |
| P1.4 | **Vision / roadmap:** na **`web/app/[locale]/page.tsx`** postoje **`id="vision"`** i **`id="roadmap"`** (`scroll-mt-24`); footer **`loc('/')#...`** je u redu. | — | 🟢 |

---

## P2 — Uloge i unutrašnji dashboard-i (web)

| # | Problem | Predlog | Status |
|---|---------|---------|--------|
| P2.1 | **Admin / supplier / logistics** — delovi i18n su dodati, ali ostaju **naslovi ili kartice** na engleskom gde komponenta nije vezana za `t()`. | Sistematski grep po `web/app/admin`, `supplier`, `logistics-partner` za hardkodovan tekst (duži stringovi). | 🟡 |
| P2.2 | **Buyer portal** vs **buyer shop** — matrica u parity planu; proveriti da li svi „nazad u portal“ / „u korpu“ linkovi vode na kanonske rute posle redirecta. | Ručni prolaz + eventualno dodatni redirect za preostale legacy `/buyer/*`. | 🟡 |
| P2.3 | **Notifikacije na webu** — da li svaka stavka u `NotificationCenter` ima smislen `actionUrl` i da li se poklapa sa mobilnim mapperom (`resolve-notification-action`). | Uskladiti poruke backenda + frontend fallback. | ? |

---

## P3 — Mobilni: povezivanje ekrana i preostali engleski

| # | Problem | Predlog | Status |
|---|---------|---------|--------|
| P3.1 | Tab bar: **Home, Steps, Products, Profile** — ostatak toka je na stacku (`orders`, `missions`, `notifications`, …). Proveriti da li **notifications** ruta postoji za sve uloge koje je korisnik tražio i da li se vraća konzistentno nazad. | Mapa „ekran A → back → tab X“ za buyer/logistics/supplier/producer. | 🟡 |
| P3.2 | **Producer** stack: ekrani kao **`missions-create`**, **`notifications`**, **`growth-journal`** — grep na `toLocale*` bez locale i na JSX sa fiksnim engleskim. | Nastavak Q3 iz parity plana; prioritet ekrani sa najviše korisnika. | 🟡 |
| P3.3 | **Deep link / notifikacija** otvara pogrešan tab ili 404 ako je korisnik multi-role. | Test matrix: jedan nalog, više uloga; edge cases u `resolveNotificationActionHref`. | ? |

---

## P4 — Podaci i „prazni“ tokovi (UX, ne samo link)

| # | Problem | Predlog | Status |
|---|---------|---------|--------|
| P4.1 | Lista ili detalj učitavaju podatke, ali **prazan state** nema CTA ka sledećem koraku (npr. nema narudžbina → link ka shopu ili partner porudžbinama). | Po jedan primarni CTA po ulozi u glavnim listama. | 🔴 |
| P4.2 | **API greške** prikazane kao sirovi string sa backenda — korisnik nema „šta dalje“. | Mapiranje kodova + link na pomoć / ponovo učitaj. | 🟡 |
| P4.3 | **Plot / batch / passport** javne rute — proveriti `@/protocol-360`, `@/plot/[code]`, da li brend linkovi sa field ekrana generišu iste URL-ove kao web marketing. | Jedan dokument „javni URL šabloni“ + test. | ? |

---

## Kako održavati ovu listu

1. Kada nešto uradite — promenite status u tabeli i po potrebi dodajte red (kratko, jedna ideja po ćeliji „Problem“).
2. Kanalni paritet (env, socket, CI) ostaje u **`WEB_MOBILE_CHANNEL_PARITY_PLAN.md`**.
3. Širi funkcionalni TODO po modulima: **`TODO_WEB_MOBILE.md`** u korenu repozitorijuma.

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
