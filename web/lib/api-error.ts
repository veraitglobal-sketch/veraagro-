import type { TFunction } from 'i18next';

/** Best-effort user-facing message from Axios-like API errors (shared across web roles). */
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

/** Prefer API body message when present; otherwise localized fallback (default `common.apiErrorGeneric`). */
export function apiErrorOrT(
  err: unknown,
  t: TFunction,
  fallbackKey = 'common.apiErrorGeneric',
): string {
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
