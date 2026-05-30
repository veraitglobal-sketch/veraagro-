import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enterpriseColors } from '../../lib/enterprise-ui';
import { GROWER_TAB_FLOAT_GAP, GROWER_TAB_PILL_BAR_HEIGHT } from '../../lib/grower-tab-bar-metrics';
import { GROWER_TAB_LABEL_KEYS } from '../../lib/grower-tab-screen-options';

/** Visible grower tabs only — must match (tabs)/_layout.tsx (href not null). */
const GROWER_MAIN_TAB_ORDER = ['index', 'field', 'chain', 'supplies', 'profile'] as const;

function isRouteVisibleInTabBar(
  routeName: string,
  options: BottomTabBarProps['descriptors'][string]['options'],
): boolean {
  if (!GROWER_MAIN_TAB_ORDER.includes(routeName as (typeof GROWER_MAIN_TAB_ORDER)[number])) {
    return false;
  }
  const href = (options as { href?: string | null }).href;
  if (href === null) return false;
  return true;
}

/** Compact floating pill — icons + label only on active tab. */
export function GrowerTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  const visibleRoutes = useMemo(() => {
    const routes = state.routes.filter((route) =>
      isRouteVisibleInTabBar(route.name, descriptors[route.key].options),
    );
    return [...routes].sort(
      (a, b) =>
        GROWER_MAIN_TAB_ORDER.indexOf(a.name as (typeof GROWER_MAIN_TAB_ORDER)[number]) -
        GROWER_MAIN_TAB_ORDER.indexOf(b.name as (typeof GROWER_MAIN_TAB_ORDER)[number]),
    );
  }, [state.routes, descriptors]);

  const focusedRouteKey = state.routes[state.index]?.key;

  const labelForRoute = (
    routeName: string,
    options: BottomTabBarProps['descriptors'][string]['options'],
  ) => {
    const key = GROWER_TAB_LABEL_KEYS[routeName];
    if (key) return t(key);
    if (options.tabBarLabel !== undefined) return String(options.tabBarLabel);
    if (options.title !== undefined) return String(options.title);
    return routeName;
  };

  return (
    <View
      style={[styles.outer, { paddingBottom: bottomInset + GROWER_TAB_FLOAT_GAP }]}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        <BlurView
          intensity={72}
          tint="dark"
          style={StyleSheet.absoluteFill}
          {...(Platform.OS === 'android'
            ? { experimentalBlurMethod: 'dimezisBlurView' as const }
            : {})}
        />
        <View style={styles.pillTint} />
        <View style={styles.bar}>
          {visibleRoutes.map((route) => {
            const { options } = descriptors[route.key];
            const label = labelForRoute(route.name, options);

            const focused = focusedRouteKey === route.key;
            const color = focused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.52)';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tab}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={typeof label === 'string' ? label : route.name}
              >
                {focused ? <View style={styles.activeOrb} pointerEvents="none" /> : null}
                {options.tabBarIcon?.({ focused, color, size: focused ? 23 : 22 })}
                {focused ? (
                  <Text style={styles.label} numberOfLines={1}>
                    {typeof label === 'string' ? label : route.name}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/** Stable tabBar prop — must not be recreated per layout render. */
export function GrowerTabBarRenderer(props: BottomTabBarProps) {
  return <GrowerTabBar {...props} />;
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  pill: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 14,
  },
  pillTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 26, 20, 0.82)',
  },
  bar: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: GROWER_TAB_PILL_BAR_HEIGHT,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 48,
    position: 'relative',
  },
  activeOrb: {
    position: 'absolute',
    top: 2,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: enterpriseColors.primary,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: -0.05,
    textAlign: 'center',
    color: '#FFFFFF',
  },
});
