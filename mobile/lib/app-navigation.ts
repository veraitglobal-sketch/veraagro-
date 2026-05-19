import { router, type Href } from 'expo-router';
import { partnerSignInHref } from './post-login-redirect';

/**
 * Never `router.replace('/')` from (producer)/(tabs) or other nested stacks — it resolves
 * to route name `index` on the wrong navigator and throws in dev (LogBox).
 */
export function replaceToSignIn(): void {
  router.replace(partnerSignInHref() as Href);
}

export function replaceToLanding(): void {
  router.replace('/login' as Href);
}

export function replaceToRoleHome(segments: readonly string[]): void {
  const root = segments[0];
  if (root === '(producer)') {
    router.replace('/(producer)/(tabs)' as Href);
    return;
  }
  if (root === '(buyer)') {
    router.replace('/(buyer)/shop' as Href);
    return;
  }
  if (root === '(logistics)') {
    router.replace('/(logistics)/(tabs)' as Href);
    return;
  }
  if (root === '(supplier)') {
    router.replace('/(supplier)/dashboard' as Href);
    return;
  }
  router.replace('/login' as Href);
}
