/**
 * Convert grower-entered planting date → ISO UTC string for POST /harvest-announcements (estimatedDate).
 * Accepts ISO day YYYY-MM-DD (HTML default) or common RS forms D.M.GGGG and D/M/GGGG.
 */
export function plantingFormDateToEstimatedIsoUtc(value: string): { ok: true; iso: string } | { ok: false } {
  const raw = value.trim();
  if (!raw) return { ok: false };

  let y: number;
  let month: number;
  let day: number;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (iso) {
    y = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else {
    const dmyDot = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(raw);
    if (dmyDot) {
      day = Number(dmyDot[1]);
      month = Number(dmyDot[2]);
      y = Number(dmyDot[3]);
    } else {
      const dmySlash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
      if (dmySlash) {
        day = Number(dmySlash[1]);
        month = Number(dmySlash[2]);
        y = Number(dmySlash[3]);
      } else {
        return { ok: false };
      }
    }
  }

  if (!Number.isFinite(y) || month < 1 || month > 12 || day < 1 || day > 31) return { ok: false };

  const utcMs = Date.UTC(y, month - 1, day, 12, 0, 0, 0);
  const check = new Date(utcMs);
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return { ok: false };
  }
  return { ok: true, iso: check.toISOString() };
}
