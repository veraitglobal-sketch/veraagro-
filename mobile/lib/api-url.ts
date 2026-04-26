import { Platform } from 'react-native';

/** Public production API; used when EAS/Expo has no EXPO_PUBLIC_API_URL (release builds). */
export const PRODUCTION_API_URL = 'https://api.biovera.app';

/**
 * Lokalni backend port kada nije postavljen EXPO_PUBLIC_API_URL.
 * Uskladi sa `PORT` u `backend` (default u main.ts: 3000; monorepo web često koristi 3004).
 * Ako API radi na 3004: postavi EXPO_PUBLIC_DEV_API_PORT=3004
 */
function getDevBackendPort(): number {
  const raw = process.env.EXPO_PUBLIC_DEV_API_PORT;
  if (raw != null && /^\d+$/.test(String(raw).trim())) {
    return parseInt(String(raw).trim(), 10);
  }
  return 3000;
}

const DEV_BACKEND_PORT = getDevBackendPort();

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/**
 * Single source of truth for backend base URL (Nest API), not the marketing site.
 * - EXPO_PUBLIC_API_URL: always wins (EAS env / .env)
 * - Release builds without env: production
 * - __DEV__ without env: local backend (simulator / emulator)
 *   Physical device in dev: set EXPO_PUBLIC_API_URL to e.g. http://192.168.x.x:3000 (same PORT as backend)
 */
export function getApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && fromEnv.trim()) {
    return stripTrailingSlash(fromEnv.trim());
  }
  if (!__DEV__) {
    return PRODUCTION_API_URL;
  }
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEV_BACKEND_PORT}`;
  }
  return `http://localhost:${DEV_BACKEND_PORT}`;
}

export const API_URL = getApiUrl();
