/**
 * Grower floating pill tab bar — keep in sync with GrowerTabBar.tsx.
 */
export const GROWER_TAB_PILL_BAR_HEIGHT = 58;
export const GROWER_TAB_FLOAT_GAP = 8;

/** Total vertical space the floating pill occupies from the screen bottom. */
export function getGrowerTabBarHeight(bottomInset: number): number {
  const inset = Math.max(bottomInset, 8);
  return GROWER_TAB_PILL_BAR_HEIGHT + inset + GROWER_TAB_FLOAT_GAP;
}

/** Small tail after last row — tab clearance comes from ScrollView marginBottom. */
export function getGrowerTabScrollPadding(_bottomInset: number, tail = 16): number {
  return tail;
}
