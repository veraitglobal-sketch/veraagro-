# Web i mobilni: isti kanali, bez duplih stranica

Plan usklađivanja tako da web i mobilna aplikacija dele iste komunikacione kanale i da se uklone redundantni ekrani. Sadržaj koji nedostaje dopunjavati na **preživeloj** stranici (jednoj ruti koja ostaje).

## Cilj

- **Isti kanali** za web i mobilni (isti API host, dogovoreni realtime gde ima smisla, isti dev/prod kontrakt).
- **Bez duplih ekrana** u mobilnoj (i po potrebi web) navigaciji.
- Funkcije koje su bile na uklonjenoj ruti prebaciti na **jedan ostali ekran**.

## Stanje implementacije (poslednji update u repou)

**Legenda oznaka:** 🟢 završeno · ❌ nije završeno ili delimično (još ima posla).

| Stavka | Status |
|--------|--------|
| P0.1 | 🟢 Urađeno: `web/.env.example` i `mobile/.env.example` — par **NEXT_PUBLIC_API_URL** / **EXPO_PUBLIC_API_URL**. |
| P0.2 | 🟢 Urađeno: `WEB_DEV_API_FALLBACK` (`http://localhost:3000`) u `web/lib/api-base.ts`; stranice i offline moduli koriste `WEB_API_BASE` gde ima smisla. |
| P0.3 | 🟢 Urađeno: web `socket.io-client` + `hooks/useNotificationSocket.ts`; `NotificationCenter` sluša isti `/notifications` namespace kao mobilni (+ fallback polling 90s). |
| P0.4 | 🟢 Urađeno: `NEXT_PUBLIC_BASE_URL` (web) i `EXPO_PUBLIC_SITE_URL` (mobile) u `.env.example` šablonima. |
| P1.1 | 🟢 Urađeno: uklonjen `mobile/app/(producer)/dashboard.tsx` redirect; `_layout` bez `dashboard` ekrana; `resolve-notification-action` ide na `/(producer)/(tabs)`; README ažuriran. |
| P1.2 | 🟢 Urađeno: uklonjen nekorišćen stack ekran `field-season.tsx` — uputstva isključivo preko `/(producer)/(tabs)/steps` (`GrowerJourneyScreen`). |
| P1.3 | 🟢 Urađeno: obrisan dupli `app/(auth)/login.tsx` (konflikt sa `app/login.tsx` na ruti `/login`). **`partner-login`** je tanak alias — `partnerSignInHref()` + redirect na **`/login`** sa `partner=1` i istim `getPostLoginPath` kao ranije; AuthGuard i ostali CTA koriste isti href. Ostaje: `buyer-login` kao poseban ekran. |
| P1.4 | 🟢 Urađeno: uklonjen legacy `app/(tabs)/` (stari redirect na producer tabs). |
| P2.1 | 🟢 Za uklonjeni `field-season` nije bilo jedinstvenog sadržaja; dodatni CTA nisu potrebni — **lista transport zadataka (grower)** sada deli i18n sa logistikom (`producer.missions.status.*`), vidi **Q3**. |
| P2.2 | 🟢 Urađeno: mobilni **SyncQueueStrip** na Početnoj (čekanje + greška + „Pošalji sad“ + Dnevnik); web **GrowerOfflineOutboxBanner** na `/grower` (IndexedDB neposlati + sync + link na `/producer/field-entry`). |
| P2.3 | 🟡 **Delimično** — buyer + notifikacije; mobilni polish (logistics, supplier, grower); **web supplier:** `supplier.messagesPage` / `supplier.ordersPage` / `supplier.orderStatusB2B` dodati za `de`/`fr`/`ro`/`bg`/`es`; prikaz statusa porudžbine na `/supplier/orders` kroz `orderStatusB2B` (ne sirovi enum). Ostaje širi web supplier / Q1 audit. |
| P3.1 | ❌ **Delimično** — redirect u `web/next.config.ts`: `/buyer/orders`, **`/buyer/dashboard`**, **`/buyer/profile`**, **`/buyer/vera-standard`** → odgovarajući **`/buyer-portal/*`**; `/producer/dashboard` → `/grower`; dodatni audit starih linkova po potrebi. |
| P3.2 | 🟢 **Urađeno uz P0.3** — `NotificationCenter` + socket + `batch:updated`; `SidebarLayout` strane dele isti bel. |
| Q4 | 🟢 Urađeno: **401** na `api` Axios — mobilni briše sesiju + `router.replace('/')` (isti princip kao web logout); **bez** trigera na `/auth/login`, `/auth/register*`, `/auth/verify-email` (kao web — pogrešna lozinka ne briše ostatak sesije na web-u). Backend i dalje nema poseban refresh token. |
| Q3 | ❌ **Delimično** — mobilni **buyer** (`buyer.*`, `buyer.passport.*`, EUR `sr-Latn`), **logistics** početna (status/datumi/batch oznake), **supplier B2B porudžbine** (`supplier.b2bOrderStatus.*`), **grower lista misija** i **detalj misije** (mapa/status/timeline/fin.), **grower Početak + Wallet** — `GET /financial-dashboard` iste sume kao web `/grower` (eskrou kartice), **lista partija** i **detalj partije** (tragabilnost, istorija lokacija, rizici kvaliteta, sr/en statusi iz `producer.batches.*`), **lista narudžbina farme** (`OrdersListScreen` — filteri, statusi kao detalju, EUR/datumi), **detalj narudžbine** (zaglavlja tajmline/isporuka), **lista njiva** (`EstateList` — empty state, parcele plural, odbrojavanje do sertifikacije), **grower Partner orders** (`producer.dashboard.partnerOrders.*`, B2B statusi, lok. datumi + `markReceivedFailed`; ispravljen prefiks `producer.partnerOrders`→`producer.dashboard.partnerOrders`), **profil → brzi linkovi** (novčanik, parcela/count, materijali, kvalitet, …), **detalj njive** (status konverzije, datumi), **supplier poruke** (sidebar nit bez imena farmera → `supplier.threadUntitledShort`); **web** `/grower/portal` — `growerPages.portalMilestone_*`, `portalFinancialMsg_*`, journey map greške, EUR po jeziku; još paritet van ovih površina i „sirovi“ API tekstovi. |
| Q5 | 🟢 Urađeno (mobilni): `resolveNotificationActionHref` za buyer / grower / logistiku / **dobavljača** (`/(supplier)/notifications`, `/supplier/notifications`, `/notifications` kada je nalog čisto **MATERIAL_SUPPLIER**); zajednički **`NotificationsListScreen`**. Web: `NotificationCenter`. |
| Q6 | 🟢 **Dokumentovano i u repou** — „Q6 — Smoke checklist”; root **`parity:typecheck`** / **`parity:backend`**; **CI** (`.github/workflows/ci.yml`): `paths-filter` + **`workflow_dispatch`** za pun prođaj svih jobova. |

---

## Matrica ruta (buyer / logistics / supplier)

Za **P2.3 / Q1** — ne mora sve biti 1:1 ako je UX namerno drugačiji.

### Buyer

| Mobilna ruta | Web (kanon) | Napomena |
|--------------|-------------|----------|
| `/(buyer)/(tabs)/dashboard` | `/buyer-portal/dashboard` (+ analytics, inventory, …) | Mobilni „lahki“ home; web portal širi. |
| `/(buyer)/(tabs)/shop` | `/buyer/shop` | Korpa/desno; **zvonce notifikacije** levo kao na dashboard tabu; kategorije preko `marketplace.categories.*` (sr u `sr-partial`). |
| `/(buyer)/(tabs)/orders`, `order/[id]` | `/buyer-portal/orders` | Stari `/buyer/orders` sada trajno redirectuje na portal. |
| `/(buyer)/cart`, `checkout` | `/buyer/shop` (web) + `(buyer)/checkout` | Isti `POST /orders` payload; **jedna porudžbina po stavci korpe** na webu i u app-u; više stavki → mobile ida na listu porudžbina nakon potvrde. |
| `/(buyer)/(tabs)/profile` | `/buyer-portal/profile` | Polja / adrese + red **Obaveštenja** na mobilnom → `/(buyer)/notifications`. |
| Notifikacije | Web: `NotificationCenter` (header) | Mobilni: `/(buyer)/notifications`; zvonce + bedž na **dashboard** i **shop** tabu; profil (red „Obaveštenja”). |
| `/(buyer)/(tabs)/vera-standard` | `/buyer-portal/vera-standard` | Isti tekst kao mobilni `buyer.veraStandard` (en/sr u `buyerPortalVeraStandard`). |

### Logistics

| Mobilna | Web |
|---------|-----|
| `/(logistics)/index` | `/logistics-partner/dashboard` |
| `/(logistics)/notifications` | `NotificationCenter` (header) na webu; URL `…/logistics-partner/…` sa `notifications` mapira u app |
| `/(logistics)/mission/[id]` | `/logistics-partner/missions` |
| `/(logistics)/handover-receiver` | `/logistics-partner/handover-receiver` |

### Supplier

| Mobilna | Web |
|---------|-----|
| `/(supplier)/dashboard` | `/supplier/dashboard` (+ `catalog`, storefront komponente) |
| `/(supplier)/notifications` | `NotificationCenter` (header); `actionUrl` kao `/supplier/notifications` ili generički `/notifications` za nalog samo sa **MATERIAL_SUPPLIER** (bez grower uloge) |
| `/(supplier)/orders` | `/supplier/orders` |
| `/(supplier)/messages` | `/supplier/messages` |

### Grower (referenca)

| Mobilna | Web |
|---------|-----|
| `/(producer)/(tabs)` | `/grower` |
| Terenski dnevnik + outbox strip | `/grower` (banner) + `/producer/field-entry` |
| `/(producer)/partner-orders`, `/b2b-supplier/[userId]`, `/b2b-thread/[id]` | `/grower/where-to-buy`, `/grower/where-to-buy/messages`, `…/thread/[id]`, `…/store/[supplierUserId]` |

Detaljna matrica, checklista i faze: [`GROWER_WEB_MOBILE_PRIORITY_PLAN.md`](GROWER_WEB_MOBILE_PRIORITY_PLAN.md).

#### Smoke (grower) — kratak set

1. **Web:** `/grower` — učitavanje, `GrowerDashboardHomeWorkflow` linkovi (uključujući terenski unos), skorašnje misije; `/grower/fields?estate=` skrol do gazdinstva.  
2. **Mob:** Početak — offline strip / refresh; partner porudžbine; otvaranje B2B thread-a (lista → chat).  
3. **Notifikacije:** `actionUrl` sa `/grower/portal?missionId=`, `/grower/fields?estate=`, `/grower/where-to-buy/store/:id` — mobilni **resolve** + `webGrowerPathToMobileHref` vode na odgovarajući ekran.  
4. **Offline:** jedan unos u airplane modu → sinhronizacija posle mreže (web banner / mob strip).

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
| P1.1 | **`(producer)/dashboard` vs tab Početna** | 🟢 **Gotovo** — redirect uklonjen; ulaz `/(producer)/(tabs)`; notifikacije mapirane na tabs. |
| P1.2 | **`field-season` vs tab „Koraci“** | 🟢 **Gotovo** — dupli stack „Uputstva“ uklonjen; sve preko taba Steps. |
| P1.3 | **`(auth)/login` vs `partner-login` vs `login`** | ❌ Dupli `(auth)/login` uklonjen. Dalje (**opciono**): spojiti `partner-login` u `login` jednim UX-om. |
| P1.4 | Legacy **`(tabs)/`** | 🟢 **Gotovo** — obrisan nekorišćen shell. |

**Nakon P1:** provera repozitorijuma (`grep` po rutama) da nema pokvarenih referenci na obrisane fajlove.

## P2 — Paritet na preživeloj stranici (mobilni + web gde treba)

| # | Zadatak | Napomena |
|---|---------|----------|
| P2.1 | **Grower:** sve što je bilo jedinstveno na uklonjenoj ruti prebaciti na ostali tab/stack (empty state, CTA, i18n). | 🟢 Nema dodatnog sadržaja na `field-season`; lista **Missions** (grower) sada koristi zajedničke ključeve za statuse/filtere (vidi **Q3**). |
| P2.2 | **Inbox sinhronizacije** (pending / error field unosi): jedno mesto u UI — uskladiti sa webom. | 🟢 **Gotovo** — mobilni `SyncQueueStrip` + web `GrowerOfflineOutboxBanner`. |
| P2.3 | **Buyer / logistics / supplier** na mobilnom: dopuniti postojeće ekrane. | ❌ Matrica ostaje; dodat polish: **supplier** narudžbine (lokalizovani statusi), **logistics** datumi/statusi misija, fix **supplier messages** (API odgovor nije sakrivao `t()`). Dalje po **Q1**. |

## P3 — Web: overlap i moduli

| # | Zadatak | Napomena |
|---|---------|----------|
| P3.1 | Audit grower / admin / buyer ruta: spojiti ili redirect. | ❌ Redirect proširen (`/buyer/dashboard`, `/buyer/profile`, `/buyer/vera-standard` → portal); dalji audit po potrebi. |
| P3.2 | Uskladiti UX notifikacija na webu sa mobilnim. | 🟢 Socket + lista u headeru (**P0.3**); dalje UX polish po UX feedbacku. |

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
| Q1 | **Paritet ekrana po ulozi** | ❌ Koristi **„Matrica ruta“** ovde; dopunjavaj backlog po redu. |
| Q2 | **Offline / sync UX** | ❌ Jedan koncept „inboxa“ ili liste pending/error/retry za terenske unose; poruke i statusi bliski web-u gde postoji isti proces. |
| Q3 | **i18n** | ❌ Isti ključevi / jezici (minimum en + sr) na obe platforme; mobilni buyer tok značajno pokriven (`buyer.*`, `buyer.passport.*`); još paritet izvan buyer-a i eventualno API/UI stringovi. |
| Q4 | **Sesija i istek JWT** | 🟢 Jednako kao sada za **401** osim na rutama pregovora o kredincijalima (vidi stanje iznad). Poseban refresh token još nije u backlogu kao feature. |
| Q5 | **Deep linkovi i notifikacije** | 🟢 Kanonski `actionUrl` ostaje web putanja; mobilni mapper u `mobile/lib/resolve-notification-action.ts` (+ uloge) vodi na odgovarajući Expo `Href`. Buyer: zvonce na **dashboard** i **shop** + profil. |
| Q6 | **Smoke / CI** | 🟢 Checklist ispod; `parity:typecheck` + `parity:backend`; jedan workflow **CI** (`ci.yml`) sa `paths-filter` + **workflow dispatch** za pun prođaj. |

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

- Opšti backlog web/mobilni: [`TODO_WEB_MOBILE.md`](archive/legacy-root/TODO_WEB_MOBILE.md) u arhivi ranijih planova.
- Unapređenja stranica i povezivanja (rute, CTAs, javni sajt): [`PAGE_IMPROVEMENTS_AND_LINKING_BACKLOG.md`](PAGE_IMPROVEMENTS_AND_LINKING_BACKLOG.md).
