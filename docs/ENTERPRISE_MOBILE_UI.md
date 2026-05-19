# Enterprise mobile UI (grower) + farmer simplicity

**Goal:** Same visual language as welcome/login — premium, minimal, serious — without confusing non-technical farmers.

## Design tokens

- Source of truth: `mobile/lib/enterprise-ui.ts`, `mobile/lib/grower-ui.ts`, `mobile/lib/home-ui.ts`
- Brand: `#2D5A27` primary, `#23471f` pressed, canvas `#F9FAFB`, white panels, `gray-200` borders

## Shell

| Piece | Use |
|-------|-----|
| `EnterpriseScreen` | Tab hubs + home scroll (gray-50 canvas, optional top wash on Home) |
| `AuthScreenShell` | Login, register, partner login |
| `GrowerTabHeader` | In-tab title + one-line lead |
| `GrowerStackHeader` | Stack screens with back |
| `growerTabScreenOptions()` | Producer bottom tabs |

## Farmer-friendly rules (mandatory)

1. **Tap targets:** min **72px** row height on main navigation; primary buttons **52px**; back button **44×44**
2. **Typography:** titles **17px semibold** on rows; body **15–16px**; avoid `fontWeight: '800'` and tiny 11px body text
3. **One action per card:** Next step = one clear CTA; hub rows = title + max 2 lines description
4. **Plain language:** i18n keys only; short Serbian default copy; no jargon in UI labels
5. **Contrast:** inactive tab/icons `gray-600`, not light gray
6. **No tricks:** no swipe-only actions; always visible chevron or button
7. **Offline:** sync strip visible on home when queue pending — do not hide behind menus

## Components

- `EnterpriseListRow` — hub tiles, large tools list
- `EnterpriseListPanel` — grouped short actions (transport links)
- `enterpriseUi.authPanel` — forms and empty states

## Migration

New grower screens: use tokens only — no direct `theme.colors` for layout/colors.

| Done | Screen |
|------|--------|
| ✓ | Welcome, login |
| ✓ | Home, Field / Chain / Supplies hubs, tab bar |
| ✓ | Estates list |
| ✓ | Batches list |
| ✓ | Settings |
| ✓ | `BioVeraSubpageHeader` (all stack subpages) |
| ✓ | Missions list, request transport, materials, compliance photos, profile tab |
| partial | Plantings (modals), field-log wizard, mission detail, harvest |

Next: mission detail, harvest, packing-flow, profile sub-screens (wallet).
