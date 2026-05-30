import type { ScrollViewProps } from 'react-native';

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

/** Tab-root bottom inset so last items clear the tab bar + safe area. */
export const TAB_SCROLL_PADDING_BOTTOM = 100;
