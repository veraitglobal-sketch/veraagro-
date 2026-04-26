/** Where to go after a generic web /login; respects explicit returnTo from query. */
export function getPathAfterWebLogin(
  user: { roles?: string[] } | null,
  returnTo: string | null,
): string {
  if (returnTo && returnTo.startsWith('/')) {
    return returnTo;
  }
  const r = user?.roles || [];
  if (r.includes('MATERIAL_SUPPLIER')) {
    return '/supplier/dashboard';
  }
  return '/';
}
