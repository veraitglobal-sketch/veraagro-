/**
 * Lets axios 401 handling call AuthContext `logout` + navigation without `api.ts` importing the context (circular deps).
 * If no handler is registered (tests / early boot), fall back to clearing stored credentials.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

type UnauthorizedHandler = () => void | Promise<void>;

let onUnauthorized: UnauthorizedHandler | null = null;
let pending: Promise<void> | null = null;

export function setAuthUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

export function notifyAuthUnauthorized() {
  if (pending) return pending;
  const handler = onUnauthorized;
  pending = Promise.resolve()
    .then(() => handler ? handler() : AsyncStorage.multiRemove(['auth_token', 'auth_user']))
    .catch((error) => { console.error('auth unauthorized handler', error); })
    .finally(() => { pending = null; });
  return pending;
}
