# PDF vodič — mobilna aplikacija (jednom generišete, commit, deploy)

Farmeri **preuzimaju gotov fajl** sa sajta. Sajt ne pravi PDF po kliku.

## Gde ide fajl

```
web/public/docs/grower-app-guide/
  biovera-grower-app-guide.sr.pdf   ← srpski
  biovera-grower-app-guide.en.pdf   ← engleski (opciono)
```

Posle deploy-a linkovi rade automatski:
- `/docs/grower-app-guide/biovera-grower-app-guide.sr.pdf`

---

## Opcija A — ručno (preporučeno ako hoćeš da sam proveriš slike)

1. Otvori u Chrome-u (obavezno **`?pdf=1`** — sve slike se učitavaju odmah, bez lazy load):

   **SR:** https://www.biovera.app/sr/grower/mobile-app-guide?pdf=1  
   **EN:** https://www.biovera.app/en/grower/mobile-app-guide?pdf=1

2. **Skroluj do dna** stranice i sačekaj da se svih **9** ekrana telefona prikaže (Welcome → Wallet).

3. **Cmd+P** (Mac) / **Ctrl+P** (Windows) → **Sačuvaj kao PDF**.

4. Sačuvaj tačno ovim imenom u folder iznad:
   - `biovera-grower-app-guide.sr.pdf` ili `.en.pdf`

5. Pošalji mi fajl / commit u git → deploy.

---

## Opcija B — automatska skripta (ista logika)

```bash
cd web
GUIDE_BASE=https://www.biovera.app npm run generate:app-guide-pdf
```

Skripta otvara `?pdf=1`, skroluje, čeka svih 9 slika, pa piše PDF u `public/docs/grower-app-guide/`.

Lokalno (mora `npm run dev` u drugom terminalu):

```bash
GUIDE_BASE=http://localhost:3000 npm run generate:app-guide-pdf
```

---

## Snimci ekrana (mora biti pre PDF-a)

| Fajl | Ekran |
|------|--------|
| `1.png` … `5.png`, `6.jpeg` … `9.jpeg` | vidi tabelu u `screens/README.md` |

Ekstenzije **malim slovima** (`1.png`, ne `1.PNG`).

---

## Kada menjate tekst ili slike

Ponovite korake (ručno ili skripta) → novi PDF u `public/` → commit → deploy.  
Stari PDF na sajtu se zameni novim fajlom — farmeri i dalje samo kliknu „Preuzmi PDF”.
