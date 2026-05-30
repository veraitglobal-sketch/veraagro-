import type { ScrollViewProps } from 'react-native';
import { getGrowerTabScrollPadding } from './grower-tab-bar-metrics';

/** Standard vertical ScrollView props — no bounce/overscroll when content fits. */
export const bioVeraScrollProps: Pick<
  ScrollViewProps,
  'style' | 'bounces' | 'overScrollMode' | 'showsVerticalScrollIndicator'
> = {
  style: { flex: 1 },
  bounces: false,
  overScrollMode: 'never',
  showsVerticalScrollIndicator: false,
};

/** Default tab-root bottom inset (no home indicator). Prefer getGrowerTabScrollPadding(insets.bottom). */
export const TAB_SCROLL_PADDING_BOTTOM = getGrowerTabScrollPadding(0);
