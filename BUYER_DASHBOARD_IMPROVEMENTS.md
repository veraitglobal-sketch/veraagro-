# Buyer Dashboard – predlozi za profesionalniji izgled

Cilj: da portal deluje kao ozbiljan B2B proizvod, a ne kao običan shop. Stil koji već imate (čist, font-light, zelene akcente) odlično se uklapa; ovo su konkretni dodaci i izmene.

---

## 1. **Dobrodošlica i kontekst kompanije**

- **“Welcome back, [Ime]”** na vrhu dashboarda (prva stvar koju korisnik vidi).
- Jedna kratka rečenica: *“Your Bio Vera B2B procurement dashboard”* ili *“Overview of your orders, deliveries and spending.”*
- Ako iz API-ja ili profila imate **naziv firme** (npr. Aldi Nord), prikažite ga: *“Logged in as [Company Name]”* u sidebaru ili *“[Company Name] · B2B account”* u headeru. To odmah daje osećaj “poslovnog” naloga.

**Implementirano:** Welcome poruka + podnaslov na dashboardu.

---

## 2. **Trust / sigurnost (jedna linija)**

- Ispod headera ili ispod welcome: mala, diskretna traka tipa:
  - *“Secure B2B platform · Certified supply chain · Your data protected”*
- Opciono ikonica (npr. štit). Bez preterivanja – jedna linija da pojača poverenje.

**Implementirano:** Trust strip ispod welcome sekcije.

---

## 3. **Brzi akcije (Quick actions)**

- Jasno istaknute glavne akcije:
  - **Pre-order 2026** (već imate)
  - **Direct orders** (već imate)
- Dodatno, kao “sekundarne” brze akcije u istom bloku ili odmah ispod:
  - **View invoices** → `/buyer-portal/invoices`
  - **Track deliveries** → `/buyer-portal/deliveries`
- Sve u istom vizuelnom jeziku (isto obrubljenje, hover), da izgleda kao jedan kontrolni panel.

**Implementirano:** Dodati linkovi za Invoices i Deliveries kao brze kartice.

---

## 4. **Resursi i podrška**

- Sekcija **“Resources”** ili **“Support”** (na dnu dashboarda ili u sidebaru):
  - *How we operate* → link ka `/for-buyers#how-we-operate`
  - *Contact* → `/contact`
  - *Product passports* → kratko objašnjenje + link ka primeru ili trade panelu gde mogu otvoriti pasoš
- Pokazuje da je platforma organizovana i da postoji jasna podrška.

**Implementirano:** Resources blok na dashboardu (How we operate, Contact).

---

## 5. **Prazna stanja (empty states)**

- Kad nema porudžbina / dostava: umesto samo “No recent orders”:
  - Jedna kratka rečenica: *“You don’t have any orders yet.”*
  - CTA: *“Place your first order”* → trade panel.
- Isto za dostave: *“No upcoming deliveries”* + *“View your orders”*.
- Daje jasno “sledeći korak” i smanjuje zbunjenost.

**Opciono:** Može se dodati u narednoj iteraciji.

---

## 6. **KPI kartice kao “kontrolna tabla”**

- Već imate Total Orders, Total Spent, Active Orders, Avg Order Value – to je dobro.
- Da izgledaju još “ozbiljnije”:
  - Blok od 4 kartice u jednoj blago zaobljenoj kutiji sa suptilnom senkom ili borderom (jedan vizuelni celina).
  - Opciono: **Outstanding invoices** (ako postoji API) ili **Next delivery** (najbliža dostava) kao peti KPI.

**Opciono:** Refinovanje kartica u jedan vizuelni blok.

---

## 7. **Sidebar – “Profil kompanije” i podrška**

- U footeru sidebara (ispod “Logged in as”):
  - Link **“Company profile”** (već imate u navigaciji).
  - Jedna mala linija: *“Need help? [Contact](link)”* ili *“Support · Privacy”*.
- Ostaje čisto, ali jasno daje utisak “proizvoda” sa podrškom i pravilima.

**Opciono:** Dodati “Need help? Contact” u sidebar.

---

## 8. **Terminologija**

- Svuda isto: npr. “Direct orders” u navigaciji i na dashboardu (ne “Place an order now” na jednoj, “Direct orders” na drugoj). Već ste blizu; samo ujednačiti labele.

---

## 9. **Izvoz / izveštaji (duži rok)**

- Za B2B kupce često očekuju:
  - *“Download report”* ili *“Export”* za spending / porudžbine (CSV ili PDF).
- Može kao dugme pored “Refresh Data” ili u sekciji Spending Trend: *“Export last 6 months”*.

---

## 10. **Obaveštenja / najave**

- Jedna linija za platformu (npr. ispod trust strip):
  - *“Pre-order 2026 is open until [datum]. [Place pre-order →]”*
- Pokazuje da ste aktivni i da komunicirate sa kupcima.

---

## Šta je urađeno u kodu

- **Welcome** + podnaslov na vrhu dashboarda.
- **Trust strip** (Secure B2B · Certified supply chain · Data protected).
- **Quick actions:** Pre-order 2026, Direct orders, **Invoices**, **Deliveries** (sve kao kartice).
- **Resources:** “How we operate”, “Contact” sa linkovima.

Ostalo (empty states, KPI box, sidebar support, export, announcements) može da se uradi u narednim iteracijama po prioritetu.
