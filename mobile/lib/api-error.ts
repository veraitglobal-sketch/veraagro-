/** Best-effort user-facing message from Axios-like API errors (React Native). */
import i18n from '../i18n/config';

function responseBody(err: unknown): unknown {
  if (!err || typeof err !== 'object' || !('response' in err)) return undefined;
  const r = (err as { response?: { data?: unknown } }).response;
  return r?.data;
}

function mergeMessageSegments(o: Record<string, unknown>): string[] {
  const bits: string[] = [];

  const pushTrimmed = (s: string) => {
    const t = s.trim();
    if (t && !bits.includes(t)) bits.push(t);
  };

  const m = o.message;
  if (typeof m === 'string') pushTrimmed(m);
  else if (Array.isArray(m)) {
    for (const x of m) {
      if (typeof x === 'string') pushTrimmed(x);
      else if (x && typeof x === 'object' && 'constraints' in (x as object)) {
        const c = (x as { constraints?: Record<string, string> }).constraints;
        if (c && typeof c === 'object') {
          for (const v of Object.values(c)) {
            if (typeof v === 'string') pushTrimmed(v);
          }
        }
      }
    }
  } else if (m && typeof m === 'object' && !Array.isArray(m)) {
    for (const v of Object.values(m as Record<string, unknown>)) {
      if (typeof v === 'string') pushTrimmed(v);
      else if (Array.isArray(v)) {
        for (const x of v) {
          if (typeof x === 'string') pushTrimmed(x);
        }
      }
    }
  }

  const errs = o.errors;
  if (Array.isArray(errs)) {
    for (const item of errs) {
      if (typeof item === 'string') pushTrimmed(item);
      else if (item && typeof item === 'object' && 'constraints' in item) {
        const c = (item as { constraints?: Record<string, string> }).constraints;
        if (c && typeof c === 'object') {
          for (const v of Object.values(c)) {
            if (typeof v === 'string') pushTrimmed(v);
          }
        }
      }
    }
  } else if (errs && typeof errs === 'object') {
    /** { field: ['msg'], ... } */
    for (const val of Object.values(errs)) {
      if (typeof val === 'string') pushTrimmed(val);
      else if (Array.isArray(val)) {
        for (const x of val) if (typeof x === 'string') pushTrimmed(x);
      }
    }
  }

  const dbg = o.debug;
  if (dbg && typeof dbg === 'object') {
    const dm = (dbg as { message?: unknown }).message;
    if (typeof dm === 'string') pushTrimmed(dm);
  }

  return bits;
}

/**
 * Nested / array `message`, class-validator noise, Nest `errors`, non-prod `debug.message`,
 * and HTML/plain string bodies from proxies.
 */
export function axiosLikeMessage(err: unknown): string | null {
  const data = responseBody(err);

  if (typeof data === 'string') {
    const t = data.trim();
    if (!t.length) {
      /** fallthrough */
    } else if (t.startsWith('{')) {
      try {
        const parsed = JSON.parse(t) as Record<string, unknown>;
        const fromObj = mergeMessageSegments(parsed);
        if (fromObj.length) return fromObj.join(' · ');
      } catch {
        /** plain string */
      }
      return t.replace(/\s+/g, ' ').slice(0, 800);
    } else if (t.startsWith('<')) {
      const stripped = t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return stripped.length ? stripped.slice(0, 400) : null;
    } else {
      return t.slice(0, 800);
    }
  }

  if (data && typeof data === 'object') {
    const bits = mergeMessageSegments(data as Record<string, unknown>);
    if (bits.length) return bits.join(' · ');

    const emsg = (data as Record<string, unknown>).error;
    if (typeof emsg === 'string') {
      const es = emsg.trim();
      if (
        es &&
        !/^Error$/i.test(es) &&
        !/^Bad Request$/i.test(es) &&
        !/^Internal Server Error$/i.test(es)
      ) {
        return es;
      }
    }
  }

  if (err instanceof Error && err.message.trim()) {
    const em = err.message.trim();
    if (!/^Request failed with status code \d+$/i.test(em)) return em;
  }

  return null;
}

/** True when the API gave no actionable text (bare 502 HTML, Axios status line only, Nest generic 500, etc.). */
export function isGenericInfrastructureMessage(text: string): boolean {
  const lower = text.trim().toLowerCase();
  if (!lower) return true;
  if (lower === 'error') return true;
  if (lower === 'internal server error') return true;
  if (/\bsomething went wrong\b/.test(lower)) return true;
  if (/^bad request$/i.test(text.trim())) return true;
  if (/^gateway timeout$/i.test(text.trim())) return true;
  if (/^service unavailable$/i.test(text.trim())) return true;
  if (/^request failed with status code \d+$/.test(lower)) return true;
  /** Detailed API / DB diagnostics should surface to the user, not collapse to canned text */
  if (/\bprisma\b/i.test(lower) && /\bP\d{4}\b/i.test(lower)) return false;
  if (/\bmigrate\b/i.test(lower) && /\bdeploy\b/i.test(lower)) return false;
  return false;
}

/**
 * Short line(s) support can use to grep logs: Nest `timestamp`/`path`, else Axios `METHOD url`.
 */
export function axiosErrorSupportHint(err: unknown): string | null {
  const data = responseBody(err);
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    const nestPath = typeof o.path === 'string' ? o.path : '';
    const nestTs = typeof o.timestamp === 'string' ? o.timestamp : '';
    if (nestPath || nestTs) {
      const line = [nestTs, nestPath].filter(Boolean).join(' · ');
      return line || null;
    }
  }

  if (typeof err === 'object' && err !== null && 'config' in err) {
    const cfg = (err as { config?: { baseURL?: string; url?: string; method?: string } }).config;
    const u = typeof cfg?.url === 'string' ? cfg.url : '';
    const m = (cfg?.method || 'POST').toUpperCase();
    if (u) return `${m} ${u}`;
  }

  return null;
}

/** Long text blob for heuristic matching (migration / schema drift). */
export function combinedApiErrorEvidence(err: unknown): string {
  const parts: string[] = [];
  const fromAxios = axiosLikeMessage(err);
  if (fromAxios?.trim()) parts.push(fromAxios.trim());
  const data = responseBody(err);
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

/** True when failure is very likely missing Prisma migrations or DB column/table drift (not bad user input). */
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
  /** 503 from Nest «ServiceUnavailable» + schema wording */
  if (st === 503 && (/prisma|migration|migrate|missing column|missing table|\bp20\d+/i.test(blob) || /\bdatabase\b/.test(blob))) {
    return true;
  }
  return false;
}

/** Timeout / abort — not a semantics error from `/missions`. */
export function axiosIsAbortOrTimeout(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code =
    'code' in err && typeof (err as { code?: unknown }).code === 'string'
      ? (err as { code: string }).code
      : '';
  if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') return true;
  const msg = err instanceof Error ? err.message : '';
  return /timeout/i.test(msg) || /timed out/i.test(msg);
}

/** API body or Error message, else `fallback` string (pass translated copy from caller). */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (isDatabaseSchemaOutOfDateError(err)) {
    const base = i18n.t('errors.databaseSchemaOutOfDate');
    const detail = axiosLikeMessage(err)?.trim();
    const hint = axiosErrorSupportHint(err);
    const extra =
      detail && detail.length > 24 && !/^internal server error$/i.test(detail) ? detail : hint;
    return extra ? `${base}\n\n${extra}` : base;
  }
  return axiosLikeMessage(err) ?? fallback;
}

/** Axios / fetch-style transport errors (offline, refused, DNS, etc.). */
export function isLikelyNetworkError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'code' in err) {
    const c = (err as { code?: unknown }).code;
    if (c === 'ECONNREFUSED' || c === 'ERR_NETWORK' || c === 'ENOTFOUND') return true;
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
