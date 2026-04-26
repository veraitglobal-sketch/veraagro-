const PROD_API = 'https://api.biovera.app';

/**
 * Public client-side API base (matches axios logic in `lib/api.ts` for non-localhost).
 * Use for `fetch` in public pages where env may be unset at build time.
 */
export function getPublicApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return PROD_API;
    }
  }
  return 'http://localhost:3004';
}
