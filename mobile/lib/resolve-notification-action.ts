import type { Href } from 'expo-router';

import { webGrowerPathToMobileHref } from './grower-web-href-to-mobile';
import { PRODUCER_ROLES } from './post-login-redirect';

export interface NotificationActionContext {
  /** From `normalizeUserRoles(user)` — disambiguates shared web paths (`/orders/:id`, `/missions/:id`). */
  roles?: string[];
}

function decodeRouteId(value: string): string {
  try { return decodeURIComponent(value); } catch { return value; }
}

function rolesUpperSet(roles: string[] | undefined): Set<string> {
  return new Set((roles ?? []).map((r) => String(r).trim().toUpperCase()).filter(Boolean));
}

function isProducerStack(roleSet: Set<string>): boolean {
  return PRODUCER_ROLES.some((r) => roleSet.has(r));
}

function isLogisticsStack(roleSet: Set<string>): boolean {
  return roleSet.has('LOGISTICS_PARTNER') || roleSet.has('DRIVER');
}

function isSupplierOnlyStack(roleSet: Set<string>): boolean {
  return roleSet.has('MATERIAL_SUPPLIER') && !isProducerStack(roleSet);
}

function orderDetailHref(orderId: string, context?: NotificationActionContext): Href {
  const R = rolesUpperSet(context?.roles);
  if (!context?.roles?.length || isProducerStack(R)) {
    return `/(producer)/orders/${encodeURIComponent(orderId)}` as Href;
  }
  if (R.has('BUYER') || R.has('CUSTOMER')) {
    return `/(buyer)/order/${encodeURIComponent(orderId)}` as Href;
  }
  return `/(producer)/orders/${encodeURIComponent(orderId)}` as Href;
}

function missionsListHref(path: string, context?: NotificationActionContext): Href {
  const R = rolesUpperSet(context?.roles);
  const webLogisticsFleet =
    path.includes('logistics-partner') || path.includes('fleet-partner');
  if (webLogisticsFleet || isLogisticsStack(R)) {
    return '/(logistics)/(tabs)' as Href;
  }
  return '/(producer)/missions' as Href;
}

/**
 * Backend stores web-style `actionUrl` values. Maps them to in-app routes per role/stack
 * (`/(producer)`, `/(buyer)`, `/(logistics)`, …). Returns `null` when there is no screen.
 */
export function resolveNotificationActionHref(
  actionUrl: string | null | undefined,
  context?: NotificationActionContext,
): Href | null {
  if (!actionUrl || typeof actionUrl !== 'string') return null;
  const trimmed = actionUrl.trim();
  if (!trimmed || trimmed === '/' || trimmed === '#') return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      return resolveNotificationActionHref(`${u.pathname}${u.search}`, context);
    } catch {
      return null;
    }
  }

  const qIndex = trimmed.indexOf('?');
  const pathPart = qIndex === -1 ? trimmed : trimmed.slice(0, qIndex);
  const queryPart = qIndex === -1 ? '' : trimmed.slice(qIndex + 1);
  const path = pathPart.replace(/\/+$/, '') || '/';

  if (/^\/admin(\/|$)/.test(path)) {
    return null;
  }

  if (path === '/producer/field-entry' || path.endsWith('/producer/field-entry')) {
    return '/(producer)/scanner' as Href;
  }

  const growerMobile = webGrowerPathToMobileHref(path, queryPart);
  if (growerMobile) {
    return growerMobile as Href;
  }

  const receiverPath = /\/(?:logistics-partner|fleet-partner)\/(handover-receiver|handover-loading)$/.exec(path);
  if (receiverPath) {
    const missionId = new URLSearchParams(queryPart).get('missionId');
    return { pathname: receiverPath[1] === 'handover-receiver' ? '/(logistics)/handover-receiver' : '/(logistics)/handover-loading',
      ...(missionId ? { params: { missionId } } : {}) } as Href;
  }
  const buyerHandover = path.match(/^\/buyer-portal\/handover\/([^/]+)$/);
  if (buyerHandover) {
    return { pathname: '/manager/handover-complete', params: { handoverId: decodeRouteId(buyerHandover[1]) } } as Href;
  }
  const buyerDelivery = path.match(/^\/buyer-portal\/deliveries\/([^/]+)$/);
  const queryDelivery = path === '/buyer-portal/deliveries' ? new URLSearchParams(queryPart).get('deliveryId') : null;
  if (buyerDelivery || queryDelivery) {
    return { pathname: '/(buyer)/delivery/[id]', params: { id: buyerDelivery ? decodeRouteId(buyerDelivery[1]) : queryDelivery! } } as Href;
  }

  /** Web buyer portal (`/buyer-portal/*`) → buyer tabs. */
  if (path === '/buyer-portal' || path.startsWith('/buyer-portal/')) {
    const remainder = path === '/buyer-portal' ? '' : path.slice('/buyer-portal/'.length);
    const segments = remainder.split('/').filter(Boolean);
    if (segments.length === 0) {
      return '/(buyer)/dashboard' as Href;
    }
    const [a0, a1] = segments;
    if (a0 === 'orders' && a1 && /^[0-9a-f-]{36}$/i.test(a1)) {
      return `/(buyer)/order/${encodeURIComponent(a1)}` as Href;
    }
    if (a0 === 'orders' || a0 === 'history') {
      return '/(buyer)/orders' as Href;
    }
    if (a0 === 'dashboard') {
      return '/(buyer)/dashboard' as Href;
    }
    if (a0 === 'profile') {
      return '/(buyer)/profile' as Href;
    }
    if (a0 === 'vera-standard') {
      return '/(buyer)/vera-standard' as Href;
    }
    if (a0 === 'notifications') {
      return '/(buyer)/notifications' as Href;
    }
    if (['deliveries', 'invoices', 'analytics', 'trade-panel', 'inventory', 'suppliers'].includes(a0 ?? '')) {
      return '/(buyer)/orders' as Href;
    }
    return '/(buyer)/dashboard' as Href;
  }

  if (path === '/buyer/shop' || path.startsWith('/buyer/shop/')) {
    return '/(buyer)/shop' as Href;
  }

  if (path === '/supplier' || path.startsWith('/supplier/')) {
    const remainder = path === '/supplier' ? '' : path.slice('/supplier/'.length);
    const seg = remainder.split('/').filter(Boolean)[0];
    if (seg === 'orders') {
      return '/(supplier)/orders' as Href;
    }
    if (seg === 'messages') {
      return '/(supplier)/messages' as Href;
    }
    if (seg === 'notifications') {
      return '/(supplier)/notifications' as Href;
    }
    return '/(supplier)/dashboard' as Href;
  }

  /** Web logistics / fleet partner shell. */
  if (path.includes('fleet-partner') || path.includes('logistics-partner')) {
    if (path.includes('handover-receiver')) {
      return '/(logistics)/handover-receiver' as Href;
    }
    if (path.includes('notifications')) {
      return '/(logistics)/notifications' as Href;
    }
    const lm = path.match(/\/missions\/([^/]+)\/?$/);
    if (lm?.[1]) {
      return `/(logistics)/mission/${encodeURIComponent(lm[1])}` as Href;
    }
    return '/(logistics)/(tabs)' as Href;
  }

  const batchMatch = path.match(/^\/batches\/([^/]+)\/?$/);
  if (batchMatch) {
    return `/(producer)/batch/${encodeURIComponent(batchMatch[1])}` as Href;
  }

  const missionPath = path.match(/^\/missions\/([^/]+)\/?$/);
  if (missionPath) {
    const id = missionPath[1];
    const R = rolesUpperSet(context?.roles);
    if (isLogisticsStack(R)) {
      return `/(logistics)/mission/${encodeURIComponent(id)}` as Href;
    }
    return `/(producer)/mission/${encodeURIComponent(id)}` as Href;
  }

  if (
    path === '/missions' ||
    path === '/mission' ||
    path === '/logistics-partner/missions' ||
    path.endsWith('/logistics-partner/missions') ||
    path === '/admin/missions' ||
    (path.includes('logistics-partner') && path.includes('mission'))
  ) {
    return missionsListHref(path, context);
  }

  const orderMatch = path.match(/^\/orders\/([^/]+)\/?$/);
  if (orderMatch) {
    return orderDetailHref(orderMatch[1], context);
  }

  const deliveryDetail = path.match(/^\/deliveries\/([^/]+)\/?$/);
  if (deliveryDetail) {
    const R = rolesUpperSet(context?.roles);
    if (isLogisticsStack(R)) {
      return '/(logistics)/(tabs)' as Href;
    }
    if (R.has('BUYER') || R.has('CUSTOMER')) {
      return { pathname: '/(buyer)/delivery/[id]', params: { id: decodeRouteId(deliveryDetail[1]) } } as Href;
    }
    return '/(producer)/orders' as Href;
  }

  if (path === '/orders') {
    const R = rolesUpperSet(context?.roles);
    if (isLogisticsStack(R) && !isProducerStack(R) && !(R.has('BUYER') || R.has('CUSTOMER'))) {
      return '/(logistics)/(tabs)' as Href;
    }
    if (isProducerStack(R) || !context?.roles?.length) {
      return '/(producer)/orders' as Href;
    }
    if (R.has('BUYER') || R.has('CUSTOMER')) {
      return '/(buyer)/orders' as Href;
    }
    return '/(producer)/orders' as Href;
  }

  if (/^\/deliveries\//.test(path)) {
    const R = rolesUpperSet(context?.roles);
    if (isLogisticsStack(R)) {
      return '/(logistics)/(tabs)' as Href;
    }
    if (R.has('BUYER') || R.has('CUSTOMER')) {
      return '/(buyer)/orders' as Href;
    }
    return '/(producer)/orders' as Href;
  }

  const handSimple = path.match(/^\/handover\/[^/]+\/?$/);
  if (handSimple && isLogisticsStack(rolesUpperSet(context?.roles))) {
    return '/(logistics)/handover-receiver' as Href;
  }

  if (path === '/notifications' || path.startsWith('/notifications/')) {
    const R = rolesUpperSet(context?.roles);
    if (R.has('BUYER') || R.has('CUSTOMER')) {
      return '/(buyer)/notifications' as Href;
    }
    if (isLogisticsStack(R) && !isProducerStack(R)) {
      return '/(logistics)/notifications' as Href;
    }
    if (isSupplierOnlyStack(R)) {
      return '/(supplier)/notifications' as Href;
    }
    return '/(producer)/notifications' as Href;
  }

  if (path === '/trust-score' || path.startsWith('/trust-score')) {
    return '/(producer)/vera-insights' as Href;
  }

  if (path.startsWith('/(producer)/')) {
    return trimmed as Href;
  }

  return null;
}
