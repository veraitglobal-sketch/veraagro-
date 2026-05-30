import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/** Edge swipe + stack pop on iOS/Android (not login roots). */
export function bioVeraStackScreenOptions(
  overrides?: NativeStackNavigationOptions,
): NativeStackNavigationOptions {
  return {
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    ...(Platform.OS === 'ios'
      ? {
          animation: 'default',
          fullScreenGestureEnabled: true,
        }
      : {
          animation: 'slide_from_right',
        }),
    ...overrides,
  };
}

/** Auth entry screens — no accidental swipe back to a stale session. */
export const authScreenNoSwipeBack: NativeStackNavigationOptions = {
  gestureEnabled: false,
  fullScreenGestureEnabled: false,
};

/** Modal routes (scanner, etc.) — swipe down to dismiss on iOS. */
export const modalStackScreenOptions: NativeStackNavigationOptions = {
  presentation: 'modal',
  gestureEnabled: true,
  ...(Platform.OS === 'ios' ? { gestureDirection: 'vertical' as const } : {}),
};
