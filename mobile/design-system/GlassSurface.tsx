import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

/** Frosted glass — low-opacity white + blur (reference mock). */
export const GLASS_OVERLAY = 'rgba(255, 255, 255, 0.22)';
export const GLASS_OVERLAY_ANDROID = 'rgba(248, 252, 255, 0.78)';
export const GLASS_BORDER = 'rgba(255, 255, 255, 0.38)';
export const GLASS_DIVIDER = 'rgba(255, 255, 255, 0.32)';

/** @deprecated use GLASS_OVERLAY */
export const GLASS_WARM_OVERLAY = GLASS_OVERLAY;
/** @deprecated */
export const GLASS_WARM_FALLBACK = GLASS_OVERLAY_ANDROID;

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  /** Blur intensity 0–100 (expo-blur). */
  blur?: number;
};

/** Frosted glass panel over GrowerHeroBackdrop. */
export function GlassSurface({
  children,
  style,
  contentStyle,
  borderRadius = 28,
  blur = 58,
}: Props) {
  return (
    <View
      style={[
        styles.shell,
        {
          borderRadius,
          borderColor: GLASS_BORDER,
        },
        style,
      ]}
    >
      <BlurView
        intensity={blur}
        tint="light"
        style={StyleSheet.absoluteFill}
        {...(Platform.OS === 'android'
          ? { experimentalBlurMethod: 'dimezisBlurView' as const }
          : {})}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: Platform.OS === 'ios' ? GLASS_OVERLAY : GLASS_OVERLAY_ANDROID,
          },
        ]}
      />
      <View style={[styles.innerGlow, { borderRadius: borderRadius - 1 }]} pointerEvents="none" />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#0f2418',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    margin: 1,
  },
  content: {
    position: 'relative',
  },
});
