# Snimci ekrana — uputstvo za mobilnu aplikaciju (proizvođač)

Dodaj **tačno ovako imenovane** PNG fajlove u **ovaj folder**:

`web/public/docs/grower-app-guide/screens/`

Stranica na portalu: **`/grower/app-guide`** (automatski učitava slike kad postoje).

---

## Pravila za fotografije

| Pravilo | Preporuka |
|--------|-----------|
| Format | **PNG** (ili JPG sa istim imenom `.jpg` — prvo probaj PNG) |
| Uređaj | Jedan telefon, ista tema (svetla), **srpski jezik** u aplikaciji |
| Kadar | Ceo ekran aplikacije, bez status bara sa ličnim porukama ako možete |
| Rezolucija | Portrait, min. **1170 × 2532** (iPhone) ili slično; ne seći UI |
| Redosled | Brojevi u imenu odgovaraju redosledu u uputstvu |

---

## Obavezni fajlovi (9 snimaka)

| # | **Tačno ime fajla** | Šta snimiti u aplikaciji |
|---|---------------------|-------------------------|
| 1 | `01-welcome.png` | Početni **Welcome** ekran (pre prijave) |
| 2 | `02-register.png` | **Registracija** / prijava partnera |
| 3 | `03-login.png` | **Prijava** (login forma) |
| 4 | `04-home.png` | Tab **Početna** (home) — „Šta dalje”, sinhronizacija |
| 5 | `05-field-tab.png` | Tab **Polje** (field hub) — vidljive kartice / alati |
| 6 | `06-lots-tab.png` | Tab **Lotovi** (chain) — partije, transport, kvalitet |
| 7 | `07-suppliers.png` | **Snabdevači** — mapa ili Porudžbine partnera (Supplies) |
| 8 | `08-profile.png` | **Profil** |
| 9 | `09-wallet.png` | **Novčanik** (wallet) |

Tekst za korak 5 (Polje) piše se na webu ispod slike — objašnjava: Moja polja, parcele, zone, zasadi, dnevnik rasta, terenski dnevnik. **Ne morate** dodatne slike za svaki podmeni osim ako želite kasnije.

---

## Opciono (v2 — samo ako želite posebne snimke)

| Ime fajla | Sadržaj |
|-----------|---------|
| `05a-field-my-fields.png` | Lista imanja / „Moja polja” |
| `05b-field-parcels.png` | Parcele / zone na mapi |
| `05c-plantings.png` | Moji zasadi |
| `05d-growth-journal.png` | Dnevnik rasta |
| `05e-field-log.png` | Terenski dnevnik (forma + kamera) |

Ako dodate opcione fajlove, javite timu da se uključe u vodič (trenutno je dovoljno `05-field-tab.png`).

---

## PDF za preuzimanje

1. Otvorite `/grower/app-guide` u browseru (ulogovan proizvođač).
2. Kada su sve slike na mestu: **Štampaj → Sačuvaj kao PDF**.
3. Sačuvajte kao: `web/public/docs/grower-app-guide/biovera-grower-app-uputstvo.pdf`
4. Link „Preuzmi PDF” na stranici vodi na taj fajl.

---

## Provera

Nakon upload-a, u browseru otvorite npr.:

`https://vas-domen/docs/grower-app-guide/screens/04-home.png`

Ako se slika vidi, uputstvo je spremno.
