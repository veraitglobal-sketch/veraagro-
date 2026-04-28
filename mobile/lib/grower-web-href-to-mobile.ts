/**
 * Web /grower/* routes → Expo paths. Kept in sync with grower-journey link hrefs.
 */
export function webGrowerHrefToMobilePath(webHref: string): string | null {
  const h = webHref.startsWith('/') ? webHref : `/${webHref}`;
  const map: Record<string, string> = {
    '/grower': '/(producer)/(tabs)/',
    '/grower/fields': '/(producer)/estates',
    '/grower/materials': '/(producer)/materials',
    '/grower/where-to-buy': '/(producer)/partner-orders',
    '/grower/batches': '/(producer)/batches',
    '/grower/quality-entry': '/(producer)/quality-entry',
    '/grower/compliance-photos': '/(producer)/compliance-photos',
    '/grower/missions/create': '/(producer)/missions-create',
    '/grower/portal': '/(producer)/missions',
    '/grower/profile': '/(producer)/(tabs)/profile',
  };
  return map[h] ?? null;
}
