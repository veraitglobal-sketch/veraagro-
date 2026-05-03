# Buyer / primopredaja / isporuka — šta još nije urađeno

*Poslednji pregled: 2026-05-03*

Kratak dokument posle uređivanja toka: **digitalna primopredaja na rampi → DELIVERED (dock) → kupčeva potvrda preuzimanja → 24h prijava problema → eskrou**.

---

## Šta je već pokriveno u kodu (za referencu)

- Razdvajanje **vremena prijema na rampi** (`deliveredAt`) i **početka 24h prozora** (`buyerPickupConfirmedAt`, ili legasi `confirmedAt` posle QR-a).
- **Web buyer portal**: `Deliveries` — ključevi `buyerPortalDeliveries` (`sr` / `en`); **`buyer-portal/handover/[handoverId]`** za završetak primopredaje primaoca (isti API kao mobilni `digital-handover/complete`).
- **Backend**: `POST /deliveries/buyer/confirm-pickup`; `confirmDelivery` / `confirmBuyerPickup` uz **transakciju/snapshot** — ako `releaseEscrowPayment` padne gde je primenljivo, dostava/porudžbina se vraćaju na prethodno stanje (bez „zaglavljenog“ CONFIRMED ako payout ne prođe).
- **`completeHandover`**: pozivalac mora biti **kupac porudžbine** ili **ADMIN** / **SUPER_ADMIN**.
- **Notifikacije za handover**: `actionUrl` ka `/buyer-portal/handover/:id` (bez zastarelog `/handover/...`).
- **`confirmBuyerPickup`**: `releaseEscrowPayment` dok je `DELIVERED`, zatim `CONFIRMED` + notifikacije gde je podešeno.
- **Mobilni menadžer**: obavezan **potpis** na `digital-handover/complete` kad je sve OK (**FRESH**).

---

## Otvoreno — proizvod / UX

| Tema | Opis |
|------|------|
| **Buyer na mobilnoj aplikaciji** | React Native još nema buyer površinu (isporuke, potvrda, prijava problema). Kupac koristi web buyer portal dok se to ne pojavi na roadmap‑u. |
| **Paritet web ↔ mobilni dock UX** | Ručno uporediti Edge slučajeve (canvas potpis, kompresija fotografija, stariji browseri) sa `mobile`. |
| **Notifikacije** | In‑app tekstovi u Nest servisima još uvek miks EN/SR; nisu centralizovani kroz prevode. |

---

## Otvoreno — pouzdanost i integracije

| Tema | Opis |
|------|------|
| **Retry payout / operativa** | Rollback štiti od „lažnog“ CONFIRMED; ako provajder plaćanja ima outage, i dalje može trebati **operativni** retry ili admin alat. |
| **Slike iz mobilnog manager handover‑a** | `photoUrls` sa uređaja mogu ostati kao **`file://` URI** ako nema koraka upload‑a ka blob/Skladu pre slanja komplet‑a backendu — treba eksplicitna provera end‑to‑end sa pravim uređajem. |
| **Store QR validacija** | `initiateHandover` još uvek prihvata **bilo koji** `STORE-…` QR; mapiranje na konkretnog primaoca/objekat nije stvarano. |
| **Lokalizovani prefiks u `actionUrl`** | Ako produkcija servira buyer portal samo pod `/{locale}/buyer-portal/...`, linkovi bez prefiksa zavise od rewrite‑a — provera u odnosu na `i18n-routing.ts`. |

---

## Otvoreno — model podataka i operativa

| Tema | Opis |
|------|------|
| **Semantička zbunjenost statusa `orders`** | Npr. `assignDelivery` podešava **`orders.CONFIRMED`** („operacija“), dok **`deliveries.CONFIRMED`** znači kupčevu takeover potvrdu. Nisu isti pojmovi — dokumentacija i UI labeli mogli bi jasnije da razdvoje „Priprema isporuke“ vs „Potvrđeno preuzimanje“. |
| **Stari slogovi bez `buyerPickupConfirmedAt`** | Legasi sa samo **`confirmedAt`** i dalje rade za 24h prozor (**fallback**). Ako želite jedinstveni izveštaj, može jednokratni backfill ili ETL pravilo — nije automatizovano. |
| **Admin / ops tooling** | Nema javnog dokumenta u kodu koji opisuje: ručno resetovanje, ponovni payout, zamrzavanje spora kod `DISPUTED` handover‑a za istu isporuku. |

---

## Otvoreno — testovi i dokumentacija procesa

| Tema | Opis |
|------|------|
| **E2E test** | Nema garantovanog automatskog testa ceo lanac od `pickup → in_transit → initiate → complete → confirmBuyerPickup → report-issue`. Referenca za misije: `docs/E2E_TRANSPORT_MISSION_SMOKE.md` — proširiti za **last‑mile buyer** ako treba jedan smoke dokument. |

---

## Predloženi prioritet

1. **Mobile buyer** (ako je u roadmap‑u) ili potvrda da je web dovoljan.
2. **Store QR** — strogo mapiranje na primaoca/objekat.
3. **file://** handover slike + E2E smoke za poslednju milju kupca (`docs/E2E_TRANSPORT_MISSION_SMOKE.md` proširiti po potrebi).
4. **Centralizacija copy‑ja u notifikacijama** (i18n na backend ili šabloni po jeziku).

---

*Kada nešto zatvoriš, skraćuj ovaj fajl ili prebacuj stavku u glavni backlog (`docs/PAGE_IMPROVEMENTS_AND_LINKING_BACKLOG.md` / `docs/OUTSTANDING.md`) da ne dupliramo istoriju.*
