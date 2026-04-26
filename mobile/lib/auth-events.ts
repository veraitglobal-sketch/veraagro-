/**
 * Lets axios 401 handler notify the single AuthContext without a circular import (api → events → context).
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
