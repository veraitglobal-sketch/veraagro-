# Web i mobilni: isti kanali, bez duplih stranica

Plan usklađivanja tako da web i mobilna aplikacija dele iste komunikacione kanale i da se uklone redundantni ekrani. Sadržaj koji nedostaje dopunjavati na **preživeloj** stranici (jednoj ruti koja ostaje).

## Cilj

- **Isti kanali** za web i mobilni (isti API host, dogovoreni realtime gde ima smisla, isti dev/prod kontrakt).
- **Bez duplih ekrana** u mobilnoj (i po potrebi web) navigaciji.
- Funkcije koje su bile na uklonjenoj ruti prebaciti na **jedan ostali ekran**.

## Stanje implementacije (poslednji update u repou)

| Stavka | Status |
|--------|--------|
| P0.1 | Urađeno: `web/.env.example` i `mobile/.env.example` — par **NEXT_PUBLIC_API_URL** / **EXPO_PUBLIC_API_URL**. |
| P0.2 | Urađeno: `WEB_DEV_API_FALLBACK` (`http://localhost:3000`) u `web/lib/api-base.ts`; stranice i offline moduli koriste `WEB_API_BASE` gde ima smisla. |
| P0.3 | Urađeno: web `socket.io-client` + `hooks/useNotificationSocket.ts`; `NotificationCenter` sluša isti `/notifications` namespace kao mobilni (+ fallback polling 90s). |
| P0.4 | Urađeno: `NEXT_PUBLIC_BASE_URL` (web) i `EXPO_PUBLIC_SITE_URL` (mobile) u `.env.example` šablonima. |
| P1.1 | Urađeno: uklonjen `mobile/app/(producer)/dashboard.tsx` redirect; `_layout` bez `dashboard` ekrana; `resolve-notification-action` ide na `/(producer)/(tabs)`; README ažuriran. |
| P1.2 | Urađeno: uklonjen nekorišćen stack ekran `field-season.tsx` — uputstva isključivo preko `/(producer)/(tabs)/steps` (`GrowerJourneyScreen`). |
| P1.3 | Delimično: obrisan dupli `app/(auth)/login.tsx` (konflikt sa `app/login.tsx` na ruti `/login`). Ostaje: `login.tsx` (univerzalna), `partner-login`, `buyer-login`. |
| P1.4 | Urađeno: uklonjen legacy `app/(tabs)/` (stari redirect na producer tabs). |
| P2.1 | Delimično — nije bilo sadržaja na uklonjenom `field-season`; bez dodatnih CTA. |
| P2.2 | Urađeno: mobilni **SyncQueueStrip** na Početnoj (čekanje + greška + „Pošalji sad“ + Dnevnik); web **GrowerOfflineOutboxBanner** na `/grower` (IndexedDB neposlati + sync + link na `/producer/field-entry`). |
| P2.3 | **Delimično** — buyer: `/buyer-portal/vera-standard`, shop korpa + checkout (`POST /orders` po stavci kao mobilni); matrica ispod; logistics/supplier uglavnom po matrici bez dodatnog modula. |
| P3.1 | **Delimično** — redirect u `web/next.config.ts`: `/buyer/orders` → `/buyer-portal/orders`, `/producer/dashboard` → `/grower`; uklonjeni dupli `page.tsx`; linkovi u `buyer/shop` i `producer/scanner`. |
| P3.2 | **Urađeno uz P0.3** — `NotificationCenter` + socket + `batch:updated`; `SidebarLayout` strane dele isti bel. |
| Q4 | Urađeno: **401** na `api` Axios — mobilni briše sesiju + `router.replace('/')` (isti princip kao web logout); **bez** trigera na `/auth/login`, `/auth/register*`, `/auth/verify-email` (kao web — pogrešna lozinka ne briše ostatak sesije na web-u). Backend i dalje nema poseban refresh token. |
| Q5 | Urađeno (mobilni): `resolveNotificationActionHref(actionUrl, { roles })` mapira web putanje (`/buyer-portal/*`, `/supplier/*`, `logistics-partner` / `fleet-partner`, `/orders/:id` prema producer vs buyer stacku, `/missions/:id` za logistiku vs grower, itd.); `notifications` ekran prosleđuje `normalizeUserRoles(user)`. Web i dalje otvara apsolutni/relativni `actionUrl` u browseru. |
| Q6 | **Dokumentovano** — „Q6 — Smoke checklist”; root **`parity:typecheck`** / **`parity:backend`**; **CI** (`.github/workflows/ci.yml`): `paths-filter` + **`workflow_dispatch`** za pun prođaj svih jobova. |

---

## Matrica ruta (buyer / logistics / supplier)

Za **P2.3 / Q1** — ne mora sve biti 1:1 ako je UX namerno drugačiji.

### Buyer

| Mobilna ruta | Web (kanon) | Napomena |
|--------------|-------------|----------|
| `/(buyer)/(tabs)/dashboard` | `/buyer-portal/dashboard` (+ analytics, inventory, …) | Mobilni „lahki“ home; web portal širi. |
| `/(buyer)/(tabs)/shop` | `/buyer/shop` | Cart/checkout na mobilnom u jednom navigatoru. |
| `/(buyer)/(tabs)/orders`, `order/[id]` | `/buyer-portal/orders` | Stari `/buyer/orders` sada trajno redirectuje na portal. |
| `/(buyer)/cart`, `checkout` | `/buyer/shop` (web) + `(buyer)/checkout` | Isti `POST /orders` payload; **jedna porudžbina po stavci korpe** na webu i u app-u; više stavki → mobile ida na listu porudžbina nakon potvrde. |
| `/(buyer)/(tabs)/profile` | `/buyer-portal/profile` | Polja / adrese. |
| `/(buyer)/(tabs)/vera-standard` | `/buyer-portal/vera-standard` | Isti tekst kao mobilni `buyer.veraStandard` (en/sr u `buyerPortalVeraStandard`). |

### Logistics

| Mobilna | Web |
|---------|-----|
| `/(logistics)/index` | `/logistics-partner/dashboard` |
| `/(logistics)/mission/[id]` | `/logistics-partner/missions` |
| `/(logistics)/handover-receiver` | `/logistics-partner/handover-receiver` |

### Supplier

| Mobilna | Web |
|---------|-----|
| `/(supplier)/dashboard` | `/supplier/dashboard` (+ `catalog`, storefront komponente) |
| `/(supplier)/orders` | `/supplier/orders` |
| `/(supplier)/messages` | `/supplier/messages` |

### Grower (referenca)

| Mobilna | Web |
|---------|-----|
| `/(producer)/(tabs)` | `/grower` |
| Terenski dnevnik + outbox strip | `/grower` (banner) + `/producer/field-entry` |

---

## P0 — Kanali i konfiguracija (mora prvo)

| # | Zadatak | Razlog |
|---|---------|--------|
| P0.1 | Jedan **kontrakt okruženja**: u CI / dokumentaciji eksplicitno `NEXT_PUBLIC_API_URL` **i** `EXPO_PUBLIC_API_URL` na **istu** vrednost po okruženju | Izbegava scenario gde web i app idu na različit backend. |
| P0.2 | **Uskladiti lokalni dev port**: jedan dogovoreni backend port; u web-u jedan konsistentan fallback (trenutno mešavina `localhost:3000` i `3004`); mobilno `EXPO_PUBLIC_DEV_API_PORT` u skladu | Istovetan „kanal“ i na developer mašini. |
| P0.3 | **Notifikacije — isti realtime model**: na web dodati **Socket.IO** na `API_URL + '/notifications'` (isti namespace i put kao na mobilnom) **ili** zvanično usvojiti REST-only na **oba** fronta | Trenutno: mobilno koristi socket, web samo REST — nije isti kanal. |
| P0.4 | **Javni URL sajta**: u env šablonu / dok mapirati `NEXT_PUBLIC_BASE_URL` (web) i `EXPO_PUBLIC_SITE_URL` (mobilno) na isti izvor za prod | QR, redirecti, linkovi iz aplikacije ka sajtu. |

## P1 — Mobilno: uklanjanje duplikata i jedan ulaz

| # | Zadatak | Akcija |
|---|---------|--------|
| P1.1 | **`(producer)/dashboard` vs tab Početna** | **Gotovo** — redirect uklonjen; ulaz `/(producer)/(tabs)`; notifikacije mapirane na tabs. |
| P1.2 | **`field-season` vs tab „Koraci“** | **Gotovo** — dupli stack „Uputstva“ uklonjen; sve preko taba Steps. |
| P1.3 | **`(auth)/login` vs `partner-login` vs `login`** | Dupli `(auth)/login` uklonjen. Dalje (**opciono**): spojiti `partner-login` u `login` jednim UX-om. |
| P1.4 | Legacy **`(tabs)/`** | **Gotovo** — obrisan nekorišćen shell. |

**Nakon P1:** provera repozitorijuma (`grep` po rutama) da nema pokvarenih referenci na obrisane fajlove.

## P2 — Paritet na preživeloj stranici (mobilni + web gde treba)

| # | Zadatak | Napomena |
|---|---------|----------|
| P2.1 | **Grower:** sve što je bilo jedinstveno na uklonjenoj ruti prebaciti na ostali tab/stack (empty state, CTA, i18n). | Nema dodatnog sadržaja na uklonjenom `field-season`; i18n bez promene. |
| P2.2 | **Inbox sinhronizacije** (pending / error field unosi): jedno mesto u UI — uskladiti sa webom. | **Gotovo** — mobilni `SyncQueueStrip` + web `GrowerOfflineOutboxBanner`. |
| P2.3 | **Buyer / logistics / supplier** na mobilnom: dopuniti postojeće ekrane. | **Matrica** + urađen buyer deo (vera-standard web, shop/checkout paritet); ostatak po Q1. |

## P3 — Web: overlap i moduli

| # | Zadatak | Napomena |
|---|---------|----------|
| P3.1 | Audit grower / admin / buyer ruta: spojiti ili redirect. | Redirecti za stare buyer/producer duplicate; dodatni audit po potrebi. |
| P3.2 | Uskladiti UX notifikacija na webu sa mobilnim. | Socket + lista u headeru (**P0.3**); dalje UX polish po UX feedbacku. |

## Redosled rada

1. **P0** — env, port, odluka socket vs REST-only na oba fronta.
2. **P1** — mobilni duplikati i čista navigacija.
3. **P2** — funkcionalni paritet na preživelim ekranima.
4. **P3** — web audit i sitno poravnanje.

## Kriterijumi „gotovo“

- Jedan dokument ili `.env.example` koji jasno navodi par **NEXT_PUBLIC_API_URL** / **EXPO_PUBLIC_API_URL** (ista vrednost) po okruženju.
- Nema dva mobilna login ekrana sa istim tokom ako nije namerno (npr. role-specific ulazi).
- Nema paralelnog grower „koraci vs sezona“ bez opravdanja.
- Web i mobilni koriste dogovoreni način notifikacija (socket na oba **ili** eksplicitno samo REST na oba).

## Sledeća lista (posle kanala i duplikata)

Radi se **nakon** što su P0–P3 zategnuti (ili u paraleli tamo gde nema konflikta sa konsolidacijom ruta). Fokus: **paritet proizvoda** na preživelim ekranima, ne novi paralelni tokovi.

| Prioritet | Tema | Kratak cilj |
|-----------|------|-------------|
| Q1 | **Paritet ekrana po ulozi** | Koristi **„Matrica ruta“** ovde; dopunjavaj backlog po redu. |
| Q2 | **Offline / sync UX** | Jedan koncept „inboxa“ ili liste pending/error/retry za terenske unose; poruke i statusi bliski web-u gde postoji isti proces. |
| Q3 | **i18n** | Isti ključevi / jezici (minimum en + sr) na obe platforme; bez UI teksta zaključanog samo na web ili samo na mobilnom bez plana pariteta. |
| Q4 | **Sesija i istek JWT** | Jednako kao sada za **401** osim na rutama pregovora o kredincijalima (vidi stanje iznad). Poseban refresh token još nije u backlogu kao feature. |
| Q5 | **Deep linkovi i notifikacije** | Kanonski `actionUrl` ostaje web putanja; mobilni mapper u `mobile/lib/resolve-notification-action.ts` (+ uloge) vodi na odgovarajući Expo `Href`. Dalje: buyer/logistics globalni ekran notifikacija ako treba ista tačka ulaza kao grower. |
| Q6 | **Smoke / CI** | Checklist ispod; `parity:typecheck` + `parity:backend`; jedan workflow **CI** (`ci.yml`) sa `paths-filter` + **workflow dispatch** za pun prođaj. |

**Redosled Q stavki:** najčešće Q1 → Q2 → Q3, pa Q4–Q6 prema riziku i release kalendaru.

## Q6 — Smoke checklist (staging / pre-release)

**Automatizacija u repou**

- Iz korena: `npm run parity:typecheck` — pokreće `tsc --noEmit` za **web** i **mobilni** paket.
- `npm run parity:backend` — u `backend/` radi `prisma generate` pa `nest build` (isti sled kao u CI ispod).
- Na **GitHub**u jedan workflow **CI** (`.github/workflows/ci.yml`): prvi job odredi promene (`dorny/paths-filter` na PR/push); zatim se pokreće **web** `typecheck` ako su dirnuti `web/**`, `shared/**`, koreni `package.json`, ili sam workflow; **mobile** ako su dirnuti `mobile/**`, `shared/**`, koreni `package.json`/lock ili workflow; **backend** ako su dirnuti `backend/**` ili workflow (`prisma generate` + `nest build`). **Workflow dispatch** („Run workflow") uvek pokreće sva tri posla bez obzira na diff.

**Backend (staging API)**

- Glavni health / alive endpoint odgovara (npr. onaj koji koristite za load balancer ako postoji).
- `POST /auth/login` za test korisnika vraća `access_token` (ili dokumentovati zašto se preskače bez seed naloga).

**Kanal env (usporedba web ↔ app)**

- `NEXT_PUBLIC_API_URL` i `EXPO_PUBLIC_API_URL` pokazuju **isti** staging/prod API host (vidi **P0.1** i `.env.example` šablone).
- Opciono: `NEXT_PUBLIC_BASE_URL` vs `EXPO_PUBLIC_SITE_URL` pokazuju javni front URL proizvoda.

**Web (ručno ili Playwright)**

- Ulogovanje jednom prioritetnom ulogom (npr. grower il buyer) — početni dashboard učitan bez 500.
- Jedan kritični autentikovani poziv (npr. lista porudžbina / polja / notifikacija) — **200**, ne **401** sa validnim tokenom.
- **Notifikacije (P0.3):** `NotificationCenter` prikazuje listu; po dogovoru proveriti da socket ide na `…/notifications` ili da polling radi ako je mreža bez WS.

**Mobilni (Expo)**

- Ulogovanje na isti API kao web (isti `EXPO_PUBLIC_API_URL`).
- Isti tip API poziva kao iznad ili odgovarajući ekran (orders / tabs / početna).
- Socket notifikacije: u dev okruženju proveriti konekciju na `API_URL` (polling fallback ako treba).

**Paritet koji ste već zaključali**

- **401:** istek JWT na API pozivu — web redirect na odgovarajući login (buyer-portal vs producer); mobilni `logout` + `router.replace('/')`, bez lažnog odjavljivanja na pogrešnu šifru pri **`/auth/login`** (vidi **Q4**).
- **`actionUrl`:** na mobilnom koristiti **`resolve-notification-action`** kad korisnik otvori notifikaciju (vidi **Q5**).

**Nakon deploya označiti u release beleškama:** koja okruženja su prošla checklist (staging / prod) i koja stavka je preskočena (npr. nema seed buyer naloga).

## Povezani dokumenti

- Opšti backlog web/mobilni: [`TODO_WEB_MOBILE.md`](../TODO_WEB_MOBILE.md) u korenu repozitorijuma.
