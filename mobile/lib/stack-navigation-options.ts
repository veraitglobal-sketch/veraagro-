import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/** Edge swipe + stack pop on iOS/Android (not login roots). */
export function bioVeraStackScreenOptions(
  overrides?: NativeStackNavigationOptions,
): NativeStackNavigationOptions {
  return {
    gestureEnabled: true,
    animation: 'slide_from_right',
    ...(Platform.OS === 'ios' ? { fullScreenGestureEnabled: true } : {}),
    ...overrides,
  };
}

/** Auth entry screens — no accidental swipe back to a stale session. */
export const authScreenNoSwipeBack: NativeStackNavigationOptions = {
  gestureEnabled: false,
  fullScreenGestureEnabled: false,
};
