/**
 * Grower screen registry — mobile routes, scaffolds, web parity paths.
 * @see mobile/docs/GROWER_NAV.md
 * @see mobile/docs/MOBILE_ARCHITECTURE.md
 */

export type GrowerScaffoldKind = 'tab' | 'hub' | 'menu' | 'stack' | 'modal' | 'unified';

export type GrowerScreenDef = {
  id: string;
  mobileRoute: string;
  webPath?: string;
  scaffold: GrowerScaffoldKind;
  titleKey?: string;
  /** Expo Stack.Screen segment name when different from id */
  stackName?: string;
  headerShown?: boolean;
};

/** Tab roots — all use GrowerTabScaffold (fillViewport: false). */
export const GROWER_TAB_SCREENS: GrowerScreenDef[] = [
  {
    id: 'home',
    mobileRoute: '/(producer)/(tabs)/',
    webPath: '/grower',
    scaffold: 'tab',
    titleKey: 'producer.tabs.home',
  },
  {
    id: 'field-hub',
    mobileRoute: '/(producer)/(tabs)/field',
    webPath: '/grower/estates',
    scaffold: 'hub',
    titleKey: 'producer.hubs.field.screenTitle',
  },
  {
    id: 'chain-hub',
    mobileRoute: '/(producer)/(tabs)/chain',
    webPath: '/grower/batches',
    scaffold: 'hub',
    titleKey: 'producer.hubs.chain.screenTitle',
  },
  {
    id: 'supplies-hub',
    mobileRoute: '/(producer)/(tabs)/supplies',
    webPath: '/grower/materials',
    scaffold: 'hub',
    titleKey: 'producer.hubs.supplies.screenTitle',
  },
  {
    id: 'profile',
    mobileRoute: '/(producer)/(tabs)/profile',
    webPath: '/grower/profile',
    scaffold: 'tab',
    titleKey: 'producer.tabs.profile',
  },
];

/** Hub sub-menus and unified tab screens (SegmentedGrowerScreen / GrowerMenuScaffold). */
export const GROWER_MENU_SCREENS: GrowerScreenDef[] = [
  {
    id: 'cultivation',
    mobileRoute: '/(producer)/cultivation',
    webPath: '/grower/plantings',
    scaffold: 'unified',
    stackName: 'cultivation',
    headerShown: false,
  },
  {
    id: 'field-diary',
    mobileRoute: '/(producer)/field-diary',
    webPath: '/grower/field-log',
    scaffold: 'unified',
    stackName: 'field-diary',
    headerShown: false,
  },
  {
    id: 'harvest-hub',
    mobileRoute: '/(producer)/harvest-hub',
    webPath: '/grower/harvest',
    scaffold: 'unified',
    stackName: 'harvest-hub',
    headerShown: false,
  },
  {
    id: 'post-harvest',
    mobileRoute: '/(producer)/post-harvest',
    webPath: '/grower/compliance',
    scaffold: 'menu',
    stackName: 'post-harvest',
    headerShown: false,
  },
  {
    id: 'procurement',
    mobileRoute: '/(producer)/procurement',
    webPath: '/grower/materials',
    scaffold: 'menu',
    stackName: 'procurement',
    headerShown: false,
  },
  {
    id: 'farm-economics',
    mobileRoute: '/(producer)/farm-economics',
    webPath: '/grower/products',
    scaffold: 'menu',
    stackName: 'farm-economics',
    headerShown: false,
  },
  {
    id: 'compliance',
    mobileRoute: '/(producer)/compliance',
    webPath: '/grower/compliance',
    scaffold: 'menu',
    stackName: 'compliance',
    headerShown: false,
  },
];

/** Primary stack workflows from hub cards. */
export const GROWER_STACK_SCREENS: GrowerScreenDef[] = [
  { id: 'estates', mobileRoute: '/(producer)/estates', webPath: '/grower/estates', scaffold: 'stack', stackName: 'estates' },
  { id: 'estates-new', mobileRoute: '/(producer)/estates/new', webPath: '/grower/estates/new', scaffold: 'stack', stackName: 'estates/new' },
  { id: 'batches', mobileRoute: '/(producer)/batches', webPath: '/grower/batches', scaffold: 'stack', stackName: 'batches' },
  { id: 'batch-new', mobileRoute: '/(producer)/batch-new', webPath: '/grower/batches/new', scaffold: 'stack', stackName: 'batch-new' },
  { id: 'missions', mobileRoute: '/(producer)/missions', webPath: '/grower/missions', scaffold: 'stack', stackName: 'missions' },
  { id: 'package-badges', mobileRoute: '/(producer)/package-badges', webPath: '/grower/package-badges', scaffold: 'stack', stackName: 'package-badges' },
  { id: 'materials', mobileRoute: '/(producer)/materials', webPath: '/grower/materials', scaffold: 'stack', stackName: 'materials' },
  { id: 'wallet', mobileRoute: '/(producer)/wallet', webPath: '/grower/wallet', scaffold: 'stack', stackName: 'wallet', headerShown: false },
  { id: 'plantings', mobileRoute: '/(producer)/plantings', webPath: '/grower/plantings', scaffold: 'stack', stackName: 'plantings', headerShown: false },
  { id: 'seed-registration', mobileRoute: '/(producer)/seed-registration', webPath: '/grower/seeds', scaffold: 'stack', stackName: 'seed-registration', headerShown: false },
  { id: 'vera-bag', mobileRoute: '/(producer)/vera-bag', webPath: '/grower/vera-bag', scaffold: 'stack', stackName: 'vera-bag' },
  { id: 'quality-entry', mobileRoute: '/(producer)/quality-entry', webPath: '/grower/quality', scaffold: 'stack', stackName: 'quality-entry' },
  { id: 'growth-journal', mobileRoute: '/(producer)/growth-journal', webPath: '/grower/growth-journal', scaffold: 'stack', stackName: 'growth-journal' },
  { id: 'partner-orders', mobileRoute: '/(producer)/partner-orders', webPath: '/grower/partner-orders', scaffold: 'stack', stackName: 'partner-orders', headerShown: false },
  { id: 'partner-order', mobileRoute: '/(producer)/partner-order/[orderId]', webPath: '/grower/partner-orders', scaffold: 'stack', stackName: 'partner-order/[orderId]', headerShown: false },
  { id: 'scanner', mobileRoute: '/(producer)/scanner', webPath: '/grower/scanner', scaffold: 'modal', stackName: 'scanner' },
  { id: 'notifications', mobileRoute: '/(producer)/notifications', webPath: '/grower/notifications', scaffold: 'stack', stackName: 'notifications' },
  { id: 'education', mobileRoute: '/(producer)/education', webPath: '/grower/education', scaffold: 'stack', stackName: 'education', titleKey: 'producer.education.screenTitle' },
  { id: 'farm-tools', mobileRoute: '/(producer)/farm-tools', webPath: '/grower/tools', scaffold: 'stack', stackName: 'farm-tools', titleKey: 'producer.dashboard.farmToolsTitle' },
];

export const GROWER_ALL_SCREENS: GrowerScreenDef[] = [
  ...GROWER_TAB_SCREENS,
  ...GROWER_MENU_SCREENS,
  ...GROWER_STACK_SCREENS,
];

/** Stack screens registered with headerShown: false — drives (producer)/_layout.tsx. */
export const GROWER_SILENT_STACK_NAMES = GROWER_ALL_SCREENS.filter(
  (s) => s.stackName && s.headerShown === false,
).map((s) => s.stackName as string);

/** Web ↔ mobile parity rows for docs / CI. */
export function growerParityMatrix(): Array<{ id: string; mobile: string; web: string; scaffold: GrowerScaffoldKind }> {
  return GROWER_ALL_SCREENS.filter((s) => s.webPath).map((s) => ({
    id: s.id,
    mobile: s.mobileRoute,
    web: s.webPath as string,
    scaffold: s.scaffold,
  }));
}

export function findGrowerScreen(id: string): GrowerScreenDef | undefined {
  return GROWER_ALL_SCREENS.find((s) => s.id === id);
}
