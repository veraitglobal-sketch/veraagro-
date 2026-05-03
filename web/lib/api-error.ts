import type { TFunction } from 'i18next';

/** Best-effort user-facing message from Axios-like errors (shared across web roles). */
export function axiosLikeMessage(err: unknown): string | null {
  if (err && typeof err === 'object' && 'response' in err) {
    const r = (err as { response?: { data?: { message?: unknown } } }).response;
    const m = r?.data?.message;
    if (typeof m === 'string' && m.trim()) return m.trim();
    if (Array.isArray(m)) {
      const joined = m
        .filter((x): x is string => typeof x === 'string')
        .map((x) => x.trim())
        .filter(Boolean)
        .join(' ');
      if (joined) return joined;
    }
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return null;
}

function responseData(err: unknown): unknown {
  if (!err || typeof err !== 'object' || !('response' in err)) return undefined;
  return (err as { response?: { data?: unknown } }).response?.data;
}

/** Full blob for detecting migration/schema errors (Nest body + message + status). */
export function combinedApiErrorEvidence(err: unknown): string {
  const parts: string[] = [];
  const ax = axiosLikeMessage(err);
  if (ax) parts.push(ax);
  const data = responseData(err);
  if (data !== undefined && data !== null) {
    try {
      if (typeof data === 'object') parts.push(JSON.stringify(data));
      else parts.push(String(data));
    } catch {
      /** ignore */
    }
  }
  const st = axiosResponseStatus(err);
  if (st != null) parts.push(`http ${st}`);
  return parts.join('\n');
}

/** True when failure likely means missing migrations / DB column-table drift (admin fix, not wrong form data). */
export function isDatabaseSchemaOutOfDateError(err: unknown): boolean {
  const blob = combinedApiErrorEvidence(err).toLowerCase();
  if (!blob.trim()) return false;
  const st = axiosResponseStatus(err);
  const strong =
    /\bp20(21|22)\b/.test(blob) ||
    /\bprisma migrate deploy\b/.test(blob) ||
    /\bprisma_migrations\b/.test(blob) ||
    /\bmissing a table or column\b/.test(blob) ||
    /\bmissing column\b/.test(blob) ||
    /\bmissing table\b/.test(blob) ||
    /\bcolumn .* does not exist\b/.test(blob) ||
    /\btable .* does not exist\b/.test(blob) ||
    /\brelation .* does not exist\b/.test(blob) ||
    /\bdb schema out of date\b/.test(blob) ||
    (/\bmigrate\b/.test(blob) && /\bdeploy\b/.test(blob)) ||
    /\bunable to resolve field\b/.test(blob) ||
    /\bthere is no such column\b/.test(blob);
  if (strong) return true;
  if (st === 503 && (/prisma|migration|migrate|missing column|missing table|\bp20\d+/i.test(blob) || /\bdatabase\b/.test(blob))) {
    return true;
  }
  return false;
}

export function axiosErrorSupportHint(err: unknown): string | null {
  const data = responseData(err);
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    const nestPath = typeof o.path === 'string' ? o.path : '';
    const nestTs = typeof o.timestamp === 'string' ? o.timestamp : '';
    if (nestPath || nestTs) {
      return [nestTs, nestPath].filter(Boolean).join(' · ') || null;
    }
  }
  if (typeof err === 'object' && err !== null && 'config' in err) {
    const cfg = (err as { config?: { url?: string; method?: string } }).config;
    const u = typeof cfg?.url === 'string' ? cfg.url : '';
    const m = (cfg?.method || 'POST').toUpperCase();
    if (u) return `${m} ${u}`;
  }
  return null;
}

/** Prefer API body message when present; otherwise localized fallback (default `common.apiErrorGeneric`). */
export function apiErrorOrT(
  err: unknown,
  t: TFunction,
  fallbackKey = 'common.apiErrorGeneric',
): string {
  if (isDatabaseSchemaOutOfDateError(err)) {
    const base = String(t('common.databaseSchemaOutOfDate'));
    const detail = axiosLikeMessage(err)?.trim();
    const hint = axiosErrorSupportHint(err);
    const extra =
      detail && detail.length > 24 && !/^internal server error$/i.test(detail) ? detail : hint;
    return extra ? `${base}\n\n${extra}` : base;
  }
  return axiosLikeMessage(err) ?? String(t(fallbackKey));
}

/** Axios / fetch-style transport errors (offline, refused, DNS, etc.). */
export function isLikelyNetworkError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'code' in err) {
    const c = (err as { code?: unknown }).code;
    if (c === 'ECONNREFUSED' || c === 'ERR_NETWORK') return true;
  }
  if (err instanceof Error && err.message.includes('Network Error')) return true;
  return false;
}

/** HTTP status from an Axios-like error, if present. */
export function axiosResponseStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'response' in err) {
    const s = (err as { response?: { status?: unknown } }).response?.status;
    return typeof s === 'number' ? s : undefined;
  }
  return undefined;
}
