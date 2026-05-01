/** Single place for default API origin in web `fetch` calls (match `web/lib/api.ts` axios base). */
/**
 * When `NEXT_PUBLIC_API_URL` is unset (local dev). Must match Nest `PORT || 3000`
 * (`backend/src/main.ts`) and mobile default in `mobile/lib/api-url.ts`.
 * If API runs on another port, set `NEXT_PUBLIC_API_URL` or `EXPO_PUBLIC_DEV_API_PORT`.
 */
export const WEB_DEV_API_FALLBACK = 'http://localhost:3000';

const trimmed = typeof process.env.NEXT_PUBLIC_API_URL === 'string' ? process.env.NEXT_PUBLIC_API_URL.trim() : '';

export const WEB_API_BASE = (trimmed || WEB_DEV_API_FALLBACK).replace(/\/$/, '');
