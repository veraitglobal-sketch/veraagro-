/**
 * Grower + shared dashboard copy for the web app.
 * **Source of truth:** `locales/en.json` (`common`, `grower` keys) — re-exported here so
 * existing `import { en } from '@/lib/messages'` keeps working. Add `sr.json` later and
 * wire `i18n` the same way as mobile when you add a language switcher.
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
