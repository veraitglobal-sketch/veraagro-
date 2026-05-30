# Bio Vera Mobile — arhitektura (implementirano)

**Ažurirano:** 2026-05-30  
**Status:** as-built — ovo je referenca, ne predlog.

---

## 1. Tri sloja

```
shared/design/tokens.ts     ← jedini izvor boja, radius, touch, tipografije
        ↓
mobile/design-system/       ← React komponente (dugmad, polja, paneli, scaffold)
        ↓
mobile/features/            ← poslovna logika; grower UI ide kroz design-system
```

**Import u feature kodu:**

```tsx
import {
  EnterpriseButton,
  EnterpriseTextField,
  EnterprisePanel,
  EnterprisePageTitle,
  EnterpriseNavSection,
  EnterpriseForm,
  GrowerTabScaffold,
  GrowerStackScaffold,
} from '@/design-system';
```

**Zabranjeno u novom grower kodu:** raw `TextInput` / `TouchableOpacity` za UI, `growerUi.formInput`, `theme.ts`.

---

## 2. Struktura fajlova

```
mobile/
├── design-system/
│   ├── index.ts                    # javni export
│   ├── theme.ts                    # tokens → StyleSheet
│   ├── EnterpriseButton.tsx
│   ├── EnterpriseTextField.tsx     # + EnterpriseTextArea + EnterprisePasswordField
│   ├── EnterprisePanel.tsx
│   ├── EnterprisePageTitle.tsx
│   ├── EnterpriseNavSection.tsx
│   ├── EnterpriseForm.tsx
│   ├── GrowerHubScreen.tsx         # generički hub tab
│   ├── SegmentedGrowerScreen.tsx   # tabbed stack (dnevnik, setva, berba)
│   └── scaffolds/
│       ├── GrowerTabScaffold.tsx   # tab root (canvas + wash + title)
│       └── GrowerStackScaffold.tsx # stack + sticky CTA
│
├── shell/
│   ├── BioVeraBoot.tsx             # splash hide kad auth spreman
│   ├── navigation-theme.ts         # stack header iz EDS tokena
│   ├── grower-screen-registry.ts   # rute, scaffold, web parity
│   └── index.ts
│
├── features/grower/hubs/
│   ├── config/field.hub.ts         # workflow koraci (data)
│   ├── config/chain.hub.ts
│   ├── config/supplies.hub.ts
│   ├── FieldHubScreen.tsx          # tanak wrapper → GrowerHubScreen
│   ├── ChainHubScreen.tsx
│   └── SuppliesHubScreen.tsx
│
└── lib/design-tokens.ts            # re-export shared/design/tokens
```

---

## 3. Komponente — specifikacija

### EnterpriseButton

| Variant | Upotreba |
|---------|----------|
| `primary` | glavna akcija, `#2D5A27` fill |
| `secondary` | sekundarna, bela + border |
| `outline` | zeleni border 2px |
| `ghost` | tekstualna |
| `danger` | destruktivna |

| Size | minHeight |
|------|-----------|
| `default` | 48px |
| `large` | 52px |
| `farmer` | 56px (teren) |

Web paritet: `PremiumButton` (`web/lib/premium-classes.ts`).

### EnterpriseTextField / EnterpriseTextArea

- label, hint, error, required
- focus border 2px `#2D5A27`
- minHeight 48 (farmer 56)

Web paritet: grower `<input min-h-[48px] focus:ring-[#2D5A27]/25>`.

### EnterprisePanel

| Variant | Kada |
|---------|------|
| `default` | sekcije, forme, liste |
| `premium` | KPI (radius 20) |
| `tint` | **retko** — certified, next step |
| `flat` | bez senke |

Web paritet: `PremiumCard`.

### EnterprisePageTitle

- eyebrow 11px uppercase green
- title 28px weight 400
- description 15px muted
- statusLine opciono

Web paritet: `PremiumPageTitle`.

### EnterpriseNavSection

- grouped rows u panelu
- icon box 40×40 rounded-lg (ne krug)
- minHeight 76px po redu

Web paritet: `GrowerDashboardHomeWorkflow`.

### EnterpriseForm

Panel + children fields + primary/cancel CTA.

### Scaffolds

| Scaffold | Ekrani |
|----------|--------|
| `GrowerTabScaffold` | tab root-ovi (Home, Profil) + hub tabovi preko GrowerHubScreen |
| `GrowerStackScaffold` | stack workflow |
| `GrowerFieldScaffold` | alias — farmer footer |
| `GrowerHubScreen` | Field / Chain / Supplies hub |

---

## 4. Design tokeni

**Fajl:** `shared/design/tokens.ts`

| Token | Vrednost | Web |
|-------|----------|-----|
| `color.primary` | `#2D5A27` | `--color-vera` |
| `color.canvas` | `#f6f5f1` | `--premium-page` |
| `color.border` | `#e5e2db` | `--premium-border` |
| `color.tint` | `#f7faf6` | grower notice panels |
| `touch.cta` | 48 | `min-h-[48px]` |
| `touch.farmer` | 56 | field mode |

---

## 5. Boot i navigacija

```
Native splash
  → BioVeraBoot (drži splash dok AuthContext.loading)
  → hideAsync
  → Welcome ili role home
```

Root `app/_layout.tsx` koristi `growerNavigationTheme` iz EDS — **ne** `theme.ts`.

---

## 6. Grower hub tabovi (migrirano)

| Tab | Implementacija |
|-----|----------------|
| Home | `EnterpriseScreen` + dashboard blocks (postojeće) |
| Polje | `GrowerHubScreen` + `field.hub.ts` |
| Lanac | `GrowerHubScreen` + `chain.hub.ts` |
| Nabavka | `GrowerHubScreen` + `supplies.hub.ts` |
| Profil | `EnterpriseScreen` + nav sections (postojeće) |

---

## 7. Migracija — redosled

| Faza | Šta | Status |
|------|-----|--------|
| 0 | tokens + design-system core + hub tabovi | ✅ |
| 1a | unified tab ekrani (dnevnik, setva, berba) + `SegmentedGrowerScreen` | ✅ |
| 1b | login → `EnterpriseTextField` + `EnterprisePasswordField` + `EnterpriseButton` | ✅ |
| 1c | splash `#f6f5f1` (canvas token) | ✅ |
| 1d | `estates/new` → EnterpriseTextField + EnterpriseButton + dsColors | ✅ |
| 2a | PlantingAddWizard + seed-registration manual form → EDS | ✅ |
| 2b | cost-calculator, field-log, growth-journal modal → EDS | ✅ |
| 2c | materials AddMaterialSheet → EDS | ✅ |
| 3 | batches, harvest, quality, products, compliance, materials search → EDS | ✅ |
| 4 | ESLint gate (zabrana TextInput / growerUi.formInput u grower) | ✅ |
| 5 | Home + Profil tab → GrowerTabScaffold | ✅ |
| 6 | `grower-screen-registry.ts` + silent stack map u `_layout` | ✅ |
| 7 | `scripts/sync-design-tokens.mjs` (web globals.css ↔ shared tokens) | ✅ |
| — | plot-mapper + partner-orders forme → EDS | ✅ |

---

## 8. Pravila (code review)

1. Novi grower ekran **mora** koristiti scaffold (`GrowerTabScaffold` ili `GrowerStackScaffold`).
2. CTA = `EnterpriseButton`, nikad `TouchableOpacity` + style.
3. Input = `EnterpriseTextField`, nikad `TextInput` + `growerUi.formInput`.
4. Sekcija = `EnterprisePanel`, ne inline border/shadow.
5. Naslov = `EnterprisePageTitle`, ne inline fontSize 22 semibold.
6. Premium zeleni tint — max 1 po ekranu (`MOBILE_SCROLL_BUDGET.md`).

---

## 9. Povezani dokumenti

| Dokument | Uloga |
|----------|-------|
| **Ovaj fajl** | as-built arhitektura |
| [ENTERPRISE_DESIGN_SYSTEM.md](./ENTERPRISE_DESIGN_SYSTEM.md) | detaljan katalog komponenti |
| [GROWER_NAV.md](./GROWER_NAV.md) | IA / rute |
| [MOBILE_SCROLL_BUDGET.md](./MOBILE_SCROLL_BUDGET.md) | premium surface budget |
| [../../docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) | ceo monorepo |

---

## 10. Primer — novi grower ekran

```tsx
import { useTranslation } from 'react-i18next';
import {
  GrowerStackScaffold,
  EnterpriseForm,
  EnterpriseTextField,
} from '@/design-system';

export default function MyNewScreen() {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  return (
    <GrowerStackScaffold>
      <EnterpriseForm
        title={t('myScreen.title')}
        submitLabel={t('common.save')}
        onSubmit={handleSave}
        loading={saving}
      >
        <EnterpriseTextField
          label={t('myScreen.name')}
          value={name}
          onChangeText={setName}
          required
        />
      </EnterpriseForm>
    </GrowerStackScaffold>
  );
}
```

---

*Ažurirati ovaj fajl kad se doda nova EDS komponenta ili migrira domen ekrana.*
