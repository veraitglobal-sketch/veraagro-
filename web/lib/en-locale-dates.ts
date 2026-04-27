/**
 * Consistent English (UK) formatting for admin UI regardless of browser locale.
 */
const DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
};

const DATE_TIME_OPTS: Intl.DateTimeFormatOptions = {
  dateStyle: 'short',
  timeStyle: 'short',
};

export function formatDateEn(iso: string | Date | null | undefined): string {
  if (iso == null) return '—';
  const d = typeof iso === 'string' || typeof iso === 'number' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', DATE_OPTS);
}

export function formatDateTimeEn(iso: string | Date | null | undefined): string {
  if (iso == null) return '—';
  const d = typeof iso === 'string' || typeof iso === 'number' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', DATE_TIME_OPTS);
}

/** Chart axis: month from `YYYY-MM` string + `-01` day. */
export function formatMonthYearShortEnFromYearMonth(value: string): string {
  const d = new Date(`${value}-01`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

export function formatMonthYearLongEnFromYearMonth(value: string): string {
  const d = new Date(`${value}-01`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
