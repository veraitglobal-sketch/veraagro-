/** Where a freshly signed-in user lands: an explicit returnTo, otherwise their own portal. */
export function getPathAfterWebLogin(
  user: { roles?: string[] } | null,
  returnTo: string | null,
): string {
  // Only same-site paths ("//evil.com" would be protocol-relative).
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo;
  }
  const r = user?.roles || [];
  if (r.includes('SUPER_ADMIN') || r.includes('ADMIN')) return '/admin';
  if (r.includes('MATERIAL_SUPPLIER')) return '/supplier/dashboard';
  if (r.includes('LOGISTICS_PARTNER')) return '/logistics-partner/dashboard';
  if (r.includes('GROWER') || r.includes('FARMER')) return '/grower';
  if (r.includes('BUYER')) return '/buyer-portal/dashboard';
  return '/';
}
