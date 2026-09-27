/** Supports the deployed API's messages as well as future structured error codes. */
export function estateDeletionBlock(error: unknown): 'batches' | 'orders' | 'system' | null {
  const body = (error as { response?: { data?: { code?: string; message?: string | string[] } } })?.response?.data;
  const message = (Array.isArray(body?.message) ? body.message.join(' ') : body?.message ?? '').toLowerCase();
  if (body?.code === 'ESTATE_HAS_BATCHES' || message.includes('cannot delete an estate that has product batches')) return 'batches';
  if (body?.code === 'ESTATE_HAS_ORDERS' || message.includes('cannot delete an estate that is linked to shop or delivery orders')) return 'orders';
  if (body?.code === 'SYSTEM_ESTATE' || message.includes('cannot delete a system estate')) return 'system';
  return null;
}

export function estateLotsHref(estate: { id: string; name: string }) {
  return { pathname: '/(producer)/batches' as const, params: { estateId: estate.id, estateName: estate.name } };
}

export function lotsForEstate<T extends { estateId?: string; estates?: { id?: string } | null }>(lots: T[], estateId?: string): T[] {
  return estateId ? lots.filter(lot => (lot.estateId ?? lot.estates?.id) === estateId) : lots;
}
