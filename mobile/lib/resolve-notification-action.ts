import type { Href } from 'expo-router';

/**
 * Backend stores web-style `actionUrl` values. Map them to in-app (producer) routes.
 * Returns `null` when the app has no dedicated screen.
 */
export function resolveNotificationActionHref(
  actionUrl: string | null | undefined,
): Href | null {
  if (!actionUrl || typeof actionUrl !== 'string') return null;
  const trimmed = actionUrl.trim();
  if (!trimmed || trimmed === '/' || trimmed === '#') return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      return resolveNotificationActionHref(`${u.pathname}${u.search}` as string);
    } catch {
      return null;
    }
  }

  const qIndex = trimmed.indexOf('?');
  const pathPart = qIndex === -1 ? trimmed : trimmed.slice(0, qIndex);
  const queryPart = qIndex === -1 ? '' : trimmed.slice(qIndex + 1);
  const path = pathPart.replace(/\/+$/, '') || '/';

  if (path === '/grower/portal' || path.endsWith('/grower/portal')) {
    const params = new URLSearchParams(queryPart);
    const missionId = params.get('missionId');
    if (missionId) {
      return `/(producer)/mission/${encodeURIComponent(missionId)}` as Href;
    }
    return '/(producer)/missions' as Href;
  }

  const batchMatch = path.match(/^\/batches\/([^/]+)\/?$/);
  if (batchMatch) {
    return `/(producer)/batch/${encodeURIComponent(batchMatch[1])}` as Href;
  }

  const missionPath = path.match(/^\/missions\/([^/]+)\/?$/);
  if (missionPath) {
    return `/(producer)/mission/${encodeURIComponent(missionPath[1])}` as Href;
  }

  if (
    path === '/missions' ||
    path === '/mission' ||
    path === '/logistics-partner/missions' ||
    path.endsWith('/logistics-partner/missions') ||
    path === '/admin/missions' ||
    (path.includes('logistics-partner') && path.includes('mission'))
  ) {
    return '/(producer)/missions' as Href;
  }

  const orderMatch = path.match(/^\/orders\/([^/]+)\/?$/);
  if (orderMatch) {
    return `/(producer)/orders/${encodeURIComponent(orderMatch[1])}` as Href;
  }

  if (path === '/orders' || /^\/deliveries\//.test(path)) {
    return '/(producer)/orders' as Href;
  }

  if (path === '/trust-score' || path.startsWith('/trust-score')) {
    return '/(producer)/vera-insights' as Href;
  }

  if (path.startsWith('/(producer)/')) {
    return trimmed as Href;
  }

  if (path.startsWith('/grower/')) {
    return '/(producer)/dashboard' as Href;
  }

  return null;
}
