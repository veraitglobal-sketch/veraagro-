/** Canonical production host — apex 301s to www on Vercel. */
export const CANONICAL_SITE_HOST = 'www.biovera.app';
export const CANONICAL_SITE_URL = `https://${CANONICAL_SITE_HOST}`;

/** Normalizes env/default to www canonical URL (no trailing slash). */
export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || CANONICAL_SITE_URL).replace(/\/$/, '');
  if (raw === 'https://biovera.app' || raw === 'http://biovera.app') {
    return CANONICAL_SITE_URL;
  }
  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    if (u.hostname === 'biovera.app') {
      u.hostname = CANONICAL_SITE_HOST;
    }
    return u.origin;
  } catch {
    return CANONICAL_SITE_URL;
  }
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === '/') return `${base}/en`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
