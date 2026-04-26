/** Single place for default API origin in web `fetch` calls (match `web/lib/api.ts` axios base). */
export const WEB_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';
