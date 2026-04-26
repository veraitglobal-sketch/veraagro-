import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Space below status bar / notch (matches web “breathing room”) */
const HEADER_BELOW_STATUS = 12;

/**
 * Bio Vera / web-aligned gutters: real safe area + 20px horizontal (not hardcoded 48/60pt).
 * Use in every subpage header and matching filter/content rows.
 */
export function useBioVeraScreenPadding() {
  const insets = useSafeAreaInsets();
  return {
    headerTop: insets.top + HEADER_BELOW_STATUS,
    topInset: insets.top,
    bottomInset: insets.bottom,
    screenPaddingLeft: 20 + insets.left,
    screenPaddingRight: 20 + insets.right,
  };
}
