/**
 * Grower + shared dashboard copy for the web app.
 * **Source of truth:** `locales/en.json`. For runtime language, use `useTranslation()` from `react-i18next`
 * (keys under `grower.*`). The `en` export remains for legacy module-level copy on a few pages being migrated.
 */
import locale from '../../locales/en.json';

export const en = {
  common: {
    requestFailed: locale.common.requestFailed,
    emDash: locale.common.emDash,
    unitKg: locale.common.unitKg,
  },
  grower: locale.grower,
} as const;

export type EnMessages = typeof en;
