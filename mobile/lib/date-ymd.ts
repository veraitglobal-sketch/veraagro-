import { resolveAppLocaleTag } from './date-locale';

/** ISO calendar date `YYYY-MM-DD` helpers (UTC noon avoids TZ off-by-one). */

export function toYmd(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseYmd(ymd: string): Date {
  const trimmed = ymd.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const today = new Date();
    return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 12));
  }
  const parsed = new Date(`${trimmed}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    const today = new Date();
    return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 12));
  }
  return parsed;
}

export function formatYmdForDisplay(ymd: string, language: string): string {
  if (!ymd.trim()) return '';
  const d = parseYmd(ymd);
  const loc = resolveAppLocaleTag(language);
  try {
    return d.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  } catch {
    return ymd;
  }
}
