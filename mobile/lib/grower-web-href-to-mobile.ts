/**
 * Web `/grower/*` (and related) routes → Expo paths. Kept in sync with grower sidebar
 * (`web/lib/grower-nav.tsx`) and grower-journey link hrefs.
 *
 * Used by deep links / notification `actionUrl` resolution so mobile lands on the same
 * flow as web, not only the producer tab root.
 */

/** Longest-first prefix patterns: web pathname prefix → mobile route */
const GROWER_PREFIX_ROUTES: Array<[prefix: string, mobile: string]> = [
  ['/grower/package-badges/print-order', '/(producer)/package-badges-print-order'],
  ['/grower/package-badges/scan', '/(producer)/package-badges'],
  ['/grower/package-badges', '/(producer)/package-badges'],
  ['/grower/where-to-buy', '/(producer)/partner-orders'],
  ['/grower/partner-orders', '/(producer)/partner-orders'],
];

const GROWER_EXACT_ROUTES: Record<string, string> = {
  '/grower': '/(producer)/(tabs)/',
  '/grower/season': '/(producer)/(tabs)/steps',
  '/grower/fields': '/(producer)/estates',
  '/grower/plantings': '/(producer)/plantings',
  '/grower/materials': '/(producer)/materials',
  '/grower/batches': '/(producer)/batches',
  '/grower/field-diary': '/(producer)/(tabs)/field-log',
  '/grower/quality-entry': '/(producer)/quality-entry',
  '/grower/compliance-photos': '/(producer)/compliance-photos',
  '/grower/education': '/(producer)/education',
  '/grower/app-guide': '/(producer)/app-guide',
  '/grower/mobile-app-guide': '/(producer)/app-guide',
  '/grower/missions/create': '/(producer)/missions-create',
  '/grower/portal': '/(producer)/missions',
  '/grower/profile': '/(producer)/(tabs)/profile',
};

/**
 * Strip `/en` or `/sr` before `/grower` so locale-prefixed web URLs still resolve.
 */
export function normalizeWebGrowerPathname(path: string): string {
  const trimmed = (path || '/').replace(/\/+$/, '') || '/';
  return trimmed.replace(/^\/(en|sr)(?=\/grower\b)/i, '') || trimmed;
}

/**
 * Map canonical grower web path + query to an Expo `Href` string.
 * Returns `null` if the path is not a known grower surface (caller may fall back).
 */
export function webGrowerPathToMobileHref(path: string, queryPart: string): string | null {
  const base = normalizeWebGrowerPathname((path || '/').replace(/\/+$/, '') || '/');
  if (!base.startsWith('/grower')) return null;

  const params = new URLSearchParams(queryPart);

  const growerThread = base.match(/^\/grower\/(?:where-to-buy|partner-orders)\/thread\/([^/]+)$/);
  if (growerThread?.[1]) {
    return `/b2b-thread/${encodeURIComponent(growerThread[1])}`;
  }

  const whereToBuyStore = base.match(/^\/grower\/where-to-buy\/store\/([^/]+)$/);
  if (whereToBuyStore?.[1]) {
    return `/b2b-supplier/${encodeURIComponent(whereToBuyStore[1])}`;
  }

  if (base === '/grower/portal') {
    const missionId = params.get('missionId');
    if (missionId) {
      return `/(producer)/mission/${encodeURIComponent(missionId)}`;
    }
    return '/(producer)/missions';
  }

  if (base === '/grower/fields') {
    const estate = params.get('estate');
    if (estate) {
      return `/(producer)/estates/${encodeURIComponent(estate)}`;
    }
    return '/(producer)/estates';
  }

  for (const [prefix, mobile] of GROWER_PREFIX_ROUTES) {
    if (base === prefix || base.startsWith(`${prefix}/`)) {
      return mobile;
    }
  }

  const exact = GROWER_EXACT_ROUTES[base];
  if (exact) return exact;

  return null;
}

/** Path-only helper for static journey links (no query). */
export function webGrowerHrefToMobilePath(webHref: string): string | null {
  const h = webHref.startsWith('/') ? webHref : `/${webHref}`;
  const pathOnly = (h.split('?')[0] ?? h).replace(/\/+$/, '') || '/';
  return webGrowerPathToMobileHref(pathOnly, '');
}
