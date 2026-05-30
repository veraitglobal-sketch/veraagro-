# Grower mobile — mapa navigacije

**Ažurirano:** 2026-05-30  
**Scope:** `mobile/app/(producer)/` + `features/grower/`  
**Scroll pravila:** [`MOBILE_SCROLL_BUDGET.md`](./MOBILE_SCROLL_BUDGET.md)

---

## Princip

| Nivo | Skrol | Primer |
|------|-------|--------|
| **Tab hub** (5×) | **Minimalno** — 2–4 kartice, bez praznog scroll-a | Polje, Lanac, Nabavka |
| **Sub-menü** | **Ne** — `GrowerMenuScaffold` (2–3 reda) | Setva, Dnevnik, Posle berbe |
| **Lista / forma** | Da | Lotovi, dnevnik rada, wizard |

---

## 5 tabova

| Tab | Hub kartica | Broj |
|-----|-------------|------|
| Početna | — | KPI + sledeći korak |
| Polje | Njiva · Setva · Dnevnik · Berba | **4** |
| Lanac | Lotovi · Posle berbe · Prevoz · Nalepnice | **4** |
| Nabavka | Nabavka · Proizvodi i troškovi | **2** |
| Profil | novčanik, usklađenost (1 ulaz), ostalo | kompaktno |

---

## Polje → sub-meniji

| Hub kartica | Ruta menija | Stavke unutra |
|-------------|-------------|---------------|
| Gazdinstvo i parcele | `/(producer)/estates` | lista njiva |
| Setva i zasadi | `/(producer)/cultivation` | seme · zasadi |
| Dnevnik | `/(producer)/field-diary` | dnevnik rada · dnevnik rasta |
| Berba | `/(producer)/harvest-hub` | žetva · Vera torba |

---

## Lanac → sub-meniji

| Hub kartica | Ruta | Napomena |
|-------------|------|----------|
| Lotovi | `/(producer)/batches` | **+** u headeru = novi lot |
| Posle berbe | `/(producer)/post-harvest` | pakovanje · kvalitet · compliance |
| Prevoz | `/(producer)/missions` | + create sheet |
| Nalepnice | `/(producer)/package-badges` | |

---

## Nabavka

| Hub kartica | Ruta | Stavke |
|-------------|------|--------|
| Nabavka | `/(producer)/procurement` | materijali · partner porudžbine · mapa (dugme) |
| Proizvodi i troškovi | `/(producer)/farm-economics` | proizvodi · kalkulator |

---

## Profil

| Ulaz | Ruta |
|------|------|
| Usklađenost (sertifikati + zabranjene) | `/(producer)/compliance` |
| Novčanik | `/(producer)/wallet` |
| Podešavanja | `(tabs)/settings` |

---

## Implementacija

| Komponenta | Uloga |
|------------|--------|
| `GrowerTabScaffold` | tab root — Početna + Profil (`fillViewport: false`) |
| `GrowerMenuScaffold` | sub-menü bez ScrollView |
| `GrowerHubScreen` | generički hub iz `config/*.hub.ts` |

Config fajlovi: `features/grower/hubs/config/field|chain|supplies.hub.ts`

Screen registry (mobile ↔ web): `mobile/shell/grower-screen-registry.ts`  
Token sync: `npm run sync:tokens` (root) — ažurira `web/app/globals.css` iz `shared/design/tokens.ts`
