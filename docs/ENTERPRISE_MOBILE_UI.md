# Enterprise mobile UI (grower) + farmer simplicity

**Goal:** Same visual language as welcome/login — premium, minimal, serious — without confusing non-technical farmers.

## Scroll budget (mandatory)

**Tab roots = scroll when needed** (`fillViewport`, full-size rows). **Stack screens = scroll** for lists/forms. Never disable scroll if menu has 6+ items.

Full rules: [`mobile/docs/MOBILE_SCROLL_BUDGET.md`](../mobile/docs/MOBILE_SCROLL_BUDGET.md)

| Level | Screens | Layout |
|-------|---------|--------|
| Tab | Home, Field, Chain, Supplies, Profile | `HubMetricsStrip` + one compact menu (≤7 rows) |
| Stack | batches, field-log, missions, … | lists, filters |
| Detail | batch/[id], wizards | one task per screen |

Početna: snapshot + jedan next-step. Bez duplog menija tabova.

## Design tokens

- Source of truth: `mobile/lib/enterprise-ui.ts`, `mobile/lib/grower-ui.ts`
- **Enterprise colors only** on grower surfaces — helpers: `enterpriseValueColor`, `enterpriseLotBucketStyle`, `enterpriseEstateStatusColor`, `enterpriseOrderStatusColor`

### Palette (no blue/amber status UI)

| Token | Hex | Use |
|-------|-----|-----|
| `primary` | `#2D5A27` | CTA, active step, certified, delivered |
| `primaryHover` | `#23471f` | Pressed buttons |
| `gray900` | `#111827` | Titles, in-transit emphasis |
| `gray700` | `#374151` | Secondary emphasis, pending money |
| `gray600` | `#4B5563` | Labels, inactive tabs |
| `gray200` | `#E5E7EB` | Borders, dividers |
| `gray100` | `#F3F4F6` | Icon wells (not green) |
| `canvas` | `#F9FAFB` | Screen background |
| `destructive` | `#991B1B` | Delete, cancel, sync error text |
| `premiumTint*` | green 5% | **Home ribbon + bonus strip only** |

**Avoid:** `#1D4ED8`, `theme.colors.warning`, colored icon squares per status.

## Shell

| Piece | Use |
|-------|-----|
| `EnterpriseScreen` | Tab hubs + home scroll (gray-50 canvas, optional top wash on Home) |
| `AuthScreenShell` | Login, register, partner login |
| `GrowerTabHeader` | In-tab title + one-line lead |
| `GrowerStackHeader` | Stack screens with back |
| `growerTabScreenOptions()` | Producer bottom tabs |

## Enterprise v2 (visual language)

| Avoid (feels “app”) | Use (feels “platform”) |
|---------------------|-------------------------|
| Zeleni kvadrati oko ikona | Bela ikona u sivom okviru; **bez chevrona** na listi |
| DEBELI UPPERCASE naslovi sekcija | `inAppSectionLabel` — 13px, sentence case |
| Bold 32px KPI brojevi | `kpiValue` — fontWeight **300** (kao welcome) |
| Zelena 3px traka u headeru | Tanki `authRule` + `inAppTitle` fontWeight 300 |
| Žuti/amber sync banneri | `EnterpriseNotice` — `navPanel` + zelena ivica |
| Default RN tab bar | `GrowerTabBar` — indikator linija |
| `fontWeight: 800` | 300–600 max |

Hub navigacija: `EnterpriseNavSection`. Tabovi: custom `GrowerTabBar`.

## Premium = rare signatures (do NOT repeat one pattern)

**Wrong:** Same green tint card on every screen → looks like a theme, not luxury.

**Right:** A few **different** moments per journey:

| Moment | Surface | Where |
|--------|---------|--------|
| Provenance ribbon | `premiumSurface` green tint | **Home only** |
| Navigation | `inAppPanel` white + gray icons | Hubs, snapshot lists |
| Next step | `authPanel` white + green CTA | Home |
| Wallet | `authPanel` + large light numerals | Profile |
| Notice | white + 3px green edge | Alerts |

Add new signature types sparingly (e.g. chain QR strip) — never clone the ribbon.

## Bio Vera signature (differentiators)

Rare moments only — **not** on every tab header (no logo + „Proizvođač“ + green rule above titles).

| Component | Where | Purpose |
|-----------|--------|---------|
| `BioVeraProvenanceRibbon` | **Home only** | Green-tint trust strip |
| `BioVeraChainTraceStrip` | **Chain tab only** | Typographic chain (parcel → retail) |
| `NextStepCard` hero accent | **Home only** | 3px left green bar on priority CTA card |
| `GrowerTabHeader` | Tab roots | Title + subtitle only (no logo lockup) |

Do **not** add on every stack screen — keeps premium feel rare.

## Farmer-friendly rules (mandatory)

1. **Tap targets:** min **72px** row height on main navigation; primary buttons **52px**; back button **44×44**
2. **Typography:** titles **17px semibold** on rows; body **15–16px**; avoid `fontWeight: '800'` and tiny 11px body text
3. **One action per card:** Next step = one clear CTA; hub rows = title + max 2 lines description
4. **Plain language:** i18n keys only; short Serbian default copy; no jargon in UI labels
5. **Contrast:** inactive tab/icons `gray-600`, not light gray
6. **No tricks:** no swipe-only actions; ceo red je klikabilan (bez strelice desno)
7. **Offline:** sync strip visible on home when queue pending — do not hide behind menus

## Components

- `EnterpriseListRow` — hub tiles, large tools list
- `EnterpriseListPanel` — grouped short actions (transport links)
- `enterpriseUi.authPanel` — forms and empty states

## Migration

New grower screens: use tokens only — no direct `theme.colors` for layout/colors.

### Urađeno (✓)

| Screen | Shell |
|--------|--------|
| Welcome, login, partner login | `AuthScreenShell` |
| Home, Field / Chain / Supplies hubs | `GrowerTabHeader` + `EnterpriseScreen` |
| Profile tab | `EnterpriseNavSection` + wallet preview |
| Estates list, batch list, settings | enterprise tokens |
| Products, Supplies hub | `GrowerStackHeader` / `GrowerTabHeader` |
| Missions list, missions-create, field-log wizard | `GrowerStackHeader` |
| Compliance photos, package badges | `GrowerStackHeader` |
| **Wallet** (full screen) | `GrowerStackHeader` + `EnterpriseScreen` |
| **Banned substances** | `GrowerStackHeader` + `EnterpriseScreen` |
| **Cost calculator** | `GrowerStackHeader` + `FlatList` (kao Proizvodi) |
| Materials (list) | `GrowerStackHeader` (map red bez chevron) |
| **Certifications** + upload | `GrowerStackHeader`, `EnterpriseNotice`, bez amber |
| **Notifications** | `GrowerStackHeader`, `filterChip`, `inAppPanel` |
| **Packing flow** | `GrowerStackHeader`, enterprise koraci, bez chevrona |

### Red za obradu (grower / producer)

| Prioritet | Screen / modul | Problemi |
|-----------|----------------|----------|
| P2 | **Plantings** (+ modali) | `theme`, `ChevronRight` |
| P2 | **Vera insights** | `theme`, warning ikone |
| P2 | **Grower journey** (steps tab) | `ChevronRight` na redovima |
| P2 | **Batches list** (`batches.tsx`) | `ChevronRight` na redovima |
| P2 | **AddMaterialSheet** | `theme` u sheet formi |
| P3 | **Orders** list/detail | `BioVeraSubpageHeader` OK, proveriti telo |
| P3 | **Education**, growth journal, quality entry | delimično stari paneli |
| P3 | **Estate detail / new / edit** | mešavina `BioVeraSubpageHeader` + theme |
| P3 | **Farm tools** (`farm-tools.tsx`) | ceo ekran na `theme` |
| P3 | **Dashboard dead sections** | `LiveInformationSection`, `RecentActivitySection`, `FarmerHomeSection` — ukloniti ili migrirati ako se još mountuju |
| — | Buyer / logistics / supplier app | van grower scope-a (poseban sprint) |

### Delimično (partial)

| Screen | Šta ostaje |
|--------|------------|
| Mission detail | blokovi OK; proveriti sve pod-komponente |
| Harvest | `HarvestForm` — proveriti |
| Materials | lista OK; **AddMaterialSheet** na theme |
| Partner orders | header OK; proveriti listu |

## Inspiration (Dribbble / fintech mobile — šta preuzimamo)

Reference: [mobile app design](https://dribbble.com/tags/mobile-app-design), [FinEase fintech](https://dribbble.com/shots/25675622-Product-design-for-FinTech-FinEase), [Dyser dashboard](https://dribbble.com/shots/24434942-Dyser-Fintech-Dashboard-UI).

| Dribbble pattern | Bio Vera rule |
|------------------|---------------|
| Siva pozadina + bele kartice sa senkom | `canvas` + `inAppPanel` |
| Jedan akcent (zelena) | `#2D5A27` samo CTA, KPI sa podacima, ribbon |
| Veliki light brojevi | `kpiValue` / wallet 34px weight 300 |
| Liste bez strelica — ceo red tap | `EnterpriseNavSection` bez chevron |
| Puno belog prostora | `minHeight: 76` redovi, `marginBottom: 20` sekcije |
| Bez šarenih status chipova | `enterprise*StatusColor` helpers |

**Ne preuzimamo:** neon gradijente, glass na karticama, 3D ilustracije, dark mode u polju, bento sa 6 boja.
