const VERA_PLATFORM_MARKERS = [
  'vera (platform',
  'vera platform',
  'line seller',
];

function isVeraPlatformEstateName(name: string | null | undefined): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return VERA_PLATFORM_MARKERS.some((m) => lower.includes(m));
}

export function getBuyerOrderFarmLabel(
  order: {
    catalogProductId?: string | null;
    catalogProduct?: { id?: string | null } | null;
    estates?: { name?: string | null } | null;
    fulfilling_estate?: { name?: string | null } | null;
  } | null | undefined,
  fallback = 'Bio Vera Marketplace',
): string {
  if (!order) return fallback;
  const fulfilling = order.fulfilling_estate?.name?.trim();
  if (fulfilling) return fulfilling;
  const isCatalog = !!(order.catalogProductId ?? order.catalogProduct?.id);
  if (isCatalog) return fallback;
  const estateName = order.estates?.name?.trim();
  if (estateName && !isVeraPlatformEstateName(estateName)) return estateName;
  return fallback;
}
