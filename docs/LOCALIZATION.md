# BioVera Localization

## Current: English Only

Both the **web app** and **mobile app** use **English only** for now.

### Web
- Date/currency formatting: `en-US`
- Help Center, Protocol 360: English content only (no language switcher)
- Logistics dashboard labels: English

### Mobile
- i18n: `en` locale only (`mobile/i18n/locales/en.json`)
- Currency/date formatting: `en-US`
- react-i18next: fallback to `en`

### Backend
- PDF exports (digital handover): `en-US` date formatting

### Adding More Languages Later
- Web: Add language switcher + translation objects
- Mobile: Add locale JSON files and update `i18n/config.ts`
- Backend: Pass locale from request or user preferences
