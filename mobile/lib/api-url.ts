import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

/** Public production API; used when EAS/Expo has no EXPO_PUBLIC_API_URL (release builds). */
/** Railway public API; keep in sync with mobile/.env and Vercel NEXT_PUBLIC_API_URL. */
export const PRODUCTION_API_URL = 'https://biovera-production.up.railway.app';

/**
 * Local backend port when EXPO_PUBLIC_API_URL is not set.
 * Match `PORT` in `backend` (default in main.ts: 3000; monorepo web often uses 3004).
 * If the API runs on 3004: set EXPO_PUBLIC_DEV_API_PORT=3004
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

/** Metro/packager host in dev, e.g. 192.168.1.5 (same machine as the Nest server). */
function devMachineLanHost(): string | null {
  const fromUri = (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } })
    .manifest2?.extra?.expoClient?.hostUri;
  const dbg =
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost ||
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;
  const pick = (raw?: string) => {
    if (!raw || typeof raw !== 'string') return null;
    const h = raw.split(':')[0]?.trim();
    if (!h || h === 'localhost' || h === '127.0.0.1') return null;
    return h;
  };
  return pick(fromUri) || pick(dbg);
}

/**
 * Single source of truth for backend base URL (Nest API), not the marketing site.
 * - EXPO_PUBLIC_API_URL: always wins (EAS env / .env)
 * - Release builds without env: production
 * - __DEV__ without env: simulators use localhost/10.0.2.2; physical device uses Expo packager
 *   host (LAN IP) so the phone can reach your Mac/PC. Override anytime with EXPO_PUBLIC_API_URL.
 */
export function getApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && fromEnv.trim()) {
    return stripTrailingSlash(fromEnv.trim());
  }
  if (!__DEV__) {
    return PRODUCTION_API_URL;
  }
  // Physical phone/tablet: localhost would point at the device itself — use LAN IP of the dev machine.
  if (Device.isDevice) {
    const host = devMachineLanHost();
    if (host) {
      return `http://${host}:${DEV_BACKEND_PORT}`;
    }
    // Tunnel / missing packager host: localhost is wrong on a real device — fall back to production API
    // so login still works. For local backend, set EXPO_PUBLIC_API_URL in mobile/.env explicitly.
    return PRODUCTION_API_URL;
  }
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEV_BACKEND_PORT}`;
  }
  return `http://localhost:${DEV_BACKEND_PORT}`;
}

export const API_URL = getApiUrl();
