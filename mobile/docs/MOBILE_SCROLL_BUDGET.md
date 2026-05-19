# Mobile: no-scroll tab roots & scroll budget

**Cilj:** Donji tabovi = **meni bez skrolovanja** (kao iOS Settings na prvom nivou). Skrol samo na **ekranima posla** (liste, forme, detalji).

---

## Tri nivoa (mentalni model)

```
┌─────────────────────────────────────────┐
│  NIVO 1 — TAB (5×)     scroll: NE        │
│  Početna · Polje · Lanac · Zalihe · Profil│
│  = KPI traka + jedan beli meni (≤7 redova)│
└─────────────────────────────────────────┘
              ↓ tap
┌─────────────────────────────────────────┐
│  NIVO 2 — STACK        scroll: DA (lista) │
│  Partije, dnevnik, misija, forma…         │
└─────────────────────────────────────────┘
              ↓ tap
┌─────────────────────────────────────────┐
│  NIVO 3 — DETALJ / ČAROLIJA  scroll: DA   │
│  batch/[id], korak forme, foto…           │
└─────────────────────────────────────────┘
```

| Nivo | Gde | Skrol | Šta sme na ekranu |
|------|-----|-------|-------------------|
| **1 Tab root** | `(tabs)/index`, `field`, `chain`, `supplies`, `profile` | **Blagi skrol** ako ne stane | `TabRootBody` + `HubMetricsStrip` + `EnterpriseNavSection` (puni redovi 72px) |
| **2 Lista / alat** | `batches`, `missions`, `field-log`, … | Dozvoljen | Filter + lista; paginacija ako >20 stavki |
| **3 Forma / detalj** | `batch/[id]`, unos, wizard | Dozvoljen | Jedan zadatak; wizard = jedan korak po ekranu |

---

## Početna (posebno pravilo)

| Blok | Max |
|------|-----|
| Zaglavlje | ime + 1 linija pozdrava |
| Snapshot | do 4 puna reda (naslov + podnaslov + ikona) |
| Sledeći korak | 1 panel, 1 zeleni CTA |

`computeNextStep()` odlučuje CTA — nema drugog sync panela, alert stacka, liste linkova.

---

## Zabrane (tab root)

- Više od **jednog** belog panela sa linkovima (spaj u jedan meni).
- **Puni redovi** — min 72px, naslov 17px + podnaslov 15px (ne „compact“ režim).
- **Metrike u vertikalnoj listi** — koristi `HubMetricsStrip`.
- Link ka nečemu što je **već tab** (npr. „Otvori Polje“ na Početnoj).
- Ista činjenica na dva mesta (parcele u headeru i u snapshotu).

---

## Gde živi sadržaj (jednom)

| Tema | Tab / ekran |
|------|-------------|
| Parcele, dnevnik, žetva | **Polje** |
| Lotovi, transport, QR | **Lanac** |
| Semena, materijali, partner | **Zalihe** |
| Novčanik, podešavanja, edukacija | **Profil** |
| Šta uraditi sad | **Početna** → sledeći korak |

Sekundarno (van tab menija): dnevnik rasta → iz zasada; skener → iz proizvoda/partija.

---

## Implementacija

| Komponenta | Uloga |
|------------|--------|
| `EnterpriseScreen` `fillViewport` | skrol uvek; `flexGrow` kad je sadržaj kratak |
| `HubMetricsStrip` | 3 KPI u jednom redu |
| `EnterpriseNavSection` | puni redovi 72px — bez `flex:1` na redovima |
| `computeNextStep` | jedini prioritet na Početnoj |

IA mapa: [`docs/GROWER_MOBILE_IA_REDESIGN.md`](../../docs/GROWER_MOBILE_IA_REDESIGN.md)

---

## Checklist pre merge-a

- [ ] Tab root: sve stavke vidljive (skrol do dna), puni redovi, bez odsecanja
- [ ] Nema duplog brojača (npr. outbox na Početnoj i u Polju istovremeno u istom obliku)
- [ ] Nova funkcija ide u **hub** ili **stack**, ne novi blok na Početnoj
- [ ] Forma sa >6 polja → podeli u korake
