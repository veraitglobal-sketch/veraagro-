import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enterpriseColors } from '../../lib/enterprise-ui';

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

/**
 * Minimal bottom tabs — white bar, active indicator line.
 * Filters out Expo Router hidden routes (href: null) so the bar shows 5 items, not 14+.
 */
export function GrowerTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

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

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {visibleRoutes.map((route) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? String(options.tabBarLabel)
            : options.title !== undefined
              ? String(options.title)
              : route.name;

        const focused = focusedRouteKey === route.key;
        const color = focused ? enterpriseColors.primary : enterpriseColors.gray600;

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
            <View style={[styles.indicator, focused && styles.indicatorOn]} />
            {options.tabBarIcon?.({ focused, color, size: 22 })}
            <Text style={[styles.label, { color }, focused && styles.labelOn]} numberOfLines={1}>
              {typeof label === 'string' ? label : route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: enterpriseColors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
    paddingTop: 6,
    minHeight: 56,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 2,
    minHeight: 50,
    maxWidth: '100%',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  indicatorOn: {
    backgroundColor: enterpriseColors.primary,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  labelOn: {
    fontWeight: '600',
  },
});
