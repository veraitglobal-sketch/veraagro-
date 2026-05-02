import type { TFunction } from 'i18next';

/** Best-effort user-facing message from Axios-like API errors */
export function axiosLikeMessage(err: unknown): string | null {
  if (err && typeof err === 'object' && 'response' in err) {
    const r = (err as { response?: { data?: { message?: unknown } } }).response;
    const m = r?.data?.message;
    if (typeof m === 'string' && m.trim()) return m.trim();
    if (Array.isArray(m)) {
      const joined = m.filter((x): x is string => typeof x === 'string').map((x) => x.trim()).filter(Boolean).join(' ');
      if (joined) return joined;
    }
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return null;
}

/** Prefer API/body message when present; otherwise localized fallback (e.g. `growerPages.apiErrorGeneric`). */
export function growerApiErrorOrT(err: unknown, t: TFunction, fallbackKey = 'growerPages.apiErrorGeneric'): string {
  return axiosLikeMessage(err) ?? String(t(fallbackKey));
}
