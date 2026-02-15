# Mobile design – usklađivanje sa web stilom

Mobilna aplikacija treba da izgleda kao deo istog BioVera brenda kao web: isti ton, boje, tipografija i osećaj.

---

## 1. Šta web koristi (referenca)

- **Boje:** `--color-vera: #2D5A27`, `--color-vera-hover: #23471f` (globals.css)
- **Font:** Geist Sans (web); na mobilu sistem font, ali **težine**: 300 (thin), 400 (normal), 600 (semibold)
- **Baze:** body 15px, line-height 1.6; text-xs 13px, text-sm 14px, text-base 15px, text-lg 17px
- **Dugmad:** min-height 44px (touch), `rounded-lg`, primary = vera green, outline varijanta sa border-2
- **Senke:** suptilne (0 1px 2px rgba(0,0,0,0.05)), blago povećanje na hover
- **Tranzicije:** 150ms za boje, pozadine, border

---

## 2. Šta mobile već ima

- **colors.ts:** primary `#2D5A27`, primaryDark `#23471f`, accent `#A4C639` – u skladu sa webom
- **theme.ts:** iste boje, spacing (xs 4 → 3xl 64), borderRadius (sm 8 → full), typography (h1–caption), shadows
- Pravilo iz .cursorrules: **Bio Vera Green (#2D5A27)** za primarne akcije, velika dugmad (60px+) za farmere

---

## 3. Predlog usklađivanja

| Oblast | Akcija |
|--------|--------|
| **Tipografija** | Podesiti `theme.typography` da odgovara web skali: body 15–16px, caption 13px, h1/h2 kao na webu. Koristiti `theme.typography` u ekranima umesto ad-hoc fontSize. |
| **Dugmad** | Jedinstvena komponenta `Button` (primary, outline, ghost) sa minHeight 44–48px, borderRadius = theme.borderRadius.md (12), kao web rounded-lg. |
| **Kartice** | Jedinstvena `Card`: suptilna senka (theme.shadows.sm), border ili borderLight, padding iz theme.spacing. |
| **Headeri ekrana** | Istí stil: paddingTop 60 / safe area, borderBottom 0.5, vera green za back/actions. |
| **Liste / redovi** | Gap theme.spacing.sm, kartice sa padding theme.spacing.md, borderRadius.md. |
| **Boje** | Svuda koristiti `colors` ili `theme.colors`, nikad hardcoded hex osim ako nije iz theme. |

---

## 4. Redosled rada (redizajn)

1. **Design tokens** – eventualno fino podešavanje `theme.ts` (body 15px, caption 13px) da bude 1:1 sa webom.
2. **Zajedničke komponente** – `Button`, `Card`, možda `ScreenHeader` u `components/ui/`, da svi ekrani koriste iste.
3. **Pilot ekran** – jedan reprezentativan ekran (npr. Dashboard ili Moji proizvodi) prilagoditi u potpunosti web stilu; zatim ostale ekrane postepeno.
4. **Lista ekrana** – growers: dashboard, products, cost-calculator, field-log, harvest, certifications, banned-substances, quality-entry, materials, compliance-photos, estates, orders, batches, missions, plot-mapper, growth-journal, vera-insights, vera-bag, wallet, scanner, notifications. Redizajn po prioritetu (najkorišćeniji prvi).

---

## 5. Napomene

- **Geist font** na webu – u React Native obično se koristi sistem font (San Francisco / Roboto) ili Expo Google Fonts ako želimo Geist i na mobilu. Za konzistentnost brenda dovoljno je uskladiti **težine** (300, 400, 600) i **veličine** (13–19px ekvivalent).
- **Farmer-friendly:** .cursorrules zahteva velika dugmad (60px+) i velike fontove (18px+) gde je to potrebno – to ostaje prioritet za ekrane gde korisnik je farmer (field log, harvest, scanner).

---

*Ovaj dokument služi kao mapa za redizajn; ažuriraćemo ga kako rad napreduje.*
