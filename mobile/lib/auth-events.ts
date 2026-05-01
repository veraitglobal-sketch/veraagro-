/**
 * Lets axios 401 handling call AuthContext `logout` + navigation without `api.ts` importing the context (circular deps).
 * If no handler is registered (tests / early boot), fall back to clearing stored credentials.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

export function setAuthUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

export function notifyAuthUnauthorized() {
  try {
    onUnauthorized?.();
  } catch (e) {
    console.error('auth unauthorized handler', e);
  }
  if (!onUnauthorized) {
    void AsyncStorage.multiRemove(['auth_token', 'auth_user']);
  }
}
