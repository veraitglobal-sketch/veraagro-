# Snimci ekrana i PDF — uputstvo za mobilnu aplikaciju

## Gde su fajlovi

`web/public/docs/grower-app-guide/`

| Fajl | Svrha |
|------|--------|
| `1.png` … `5.png`, `6.jpeg` … `9.jpeg` | Snimci ekrana (web vodič) |
| `biovera-grower-app-guide.sr.pdf` | **Statički PDF (sr)** — farmeri preuzimaju direktno |
| `biovera-grower-app-guide.en.pdf` | **Statički PDF (en)** |

Stranica: **`/sr/grower/mobile-app-guide`** (javno) · **`/grower/app-guide`** (ulogovan grower)

## Snimci ekrana

| Fajl | Ekran |
|------|--------|
| `1.png` | Welcome |
| `2.png` | Registracija |
| `3.png` | Prijava |
| `4.png` | Početna (home) |
| `5.png` | Polje (field tab) |
| `6.jpeg` | Lotovi |
| `7.jpeg` | Snabdevači |
| `8.jpeg` | Profil |
| `9.jpeg` | Novčanik |

Koristite **mala slova** u ekstenziji — na Linux/Vercel `1.PNG` ≠ `1.png`.

## PDF (jednom generišete, commit, deploy)

Farmeri **preuzimaju gotov PDF** — sajt ne generiše PDF po kliku (štedi server i bandwidth).

```bash
cd web
# protiv produkcije (preporučeno kad je vodič već live):
GUIDE_BASE=https://www.biovera.app npm run generate:app-guide-pdf

# ili lokalno (drugi terminal: npm run dev):
npm run generate:app-guide-pdf
```

Skripta koristi Playwright i upisuje PDF u `public/docs/grower-app-guide/`.  
Posle izmene teksta ili snimaka: ponovo pokrenite skriptu, commit, deploy.

Ručno: otvorite vodič → Štampaj → Sačuvaj kao PDF → sačuvajte pod gore navedenim imenom.
