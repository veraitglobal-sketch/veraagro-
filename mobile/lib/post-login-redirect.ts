/**
 * One place for “after JWT login, which home stack?” so index, `/login` (+ `partner=1`), and buyer-login stay in sync.
 * Order: grower app → partner store (material supplier) → buyer → logistics.
 */
export const PRODUCER_ROLES = ['ADMIN', 'FARMER', 'PARTNER', 'GROWER'] as const;

export function normalizeUserRoles(user: { role?: string; roles?: string[] } | null | undefined): string[] {
  if (!user) return [];
  const r = user.roles;
  if (r && r.length > 0) return r;
  return user.role ? [user.role] : [];
}

function isProducer(roles: string[]): boolean {
  return roles.some((x) => (PRODUCER_ROLES as readonly string[]).includes(x));
}

export type PartnerEntryRedirect = 'estates/new' | 'estates' | undefined;

/**
 * Canonical producer/supplier/logistics sign-in: same screen as universal `/login`, with post-login routing for grower deep-links.
 * Prefer this over the `/partner-login` alias route.
 */
export function partnerSignInHref(redirect?: PartnerEntryRedirect): { pathname: '/login'; params: Record<string, string> } {
  const params: Record<string, string> = { partner: '1' };
  if (redirect === 'estates/new' || redirect === 'estates') {
    params.redirect = redirect;
  }
  return { pathname: '/login', params };
}

/**
 * @returns e.g. `/(producer)/(tabs)` or `null` if the account has no known mobile “home” (then caller should show error + logout).
 */
export function getPostLoginPath(roles: string[], options?: { partnerEntry?: PartnerEntryRedirect }): string | null {
  if (isProducer(roles)) {
    if (options?.partnerEntry === 'estates/new') return '/(producer)/estates/new';
    if (options?.partnerEntry === 'estates') return '/(producer)/estates';
    return '/(producer)/(tabs)';
  }
  if (roles.includes('MATERIAL_SUPPLIER')) {
    return '/(supplier)/dashboard';
  }
  if (roles.includes('BUYER') || roles.includes('CUSTOMER')) {
    return '/(buyer)/shop';
  }
  if (roles.includes('LOGISTICS_PARTNER')) {
    return '/(logistics)';
  }
  return null;
}
