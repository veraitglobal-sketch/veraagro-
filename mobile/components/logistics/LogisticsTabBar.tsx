import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enterpriseColors } from '../../lib/enterprise-ui';

const LOGISTICS_TAB_ORDER = ['index', 'missions', 'profile'] as const;

function isVisible(routeName: string, options: BottomTabBarProps['descriptors'][string]['options']): boolean {
  if (!LOGISTICS_TAB_ORDER.includes(routeName as (typeof LOGISTICS_TAB_ORDER)[number])) return false;
  const href = (options as { href?: string | null }).href;
  if (href === null) return false;
  return true;
}

export function LogisticsTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const visibleRoutes = useMemo(() => {
    const routes = state.routes.filter((route) => isVisible(route.name, descriptors[route.key].options));
    return [...routes].sort(
      (a, b) =>
        LOGISTICS_TAB_ORDER.indexOf(a.name as (typeof LOGISTICS_TAB_ORDER)[number]) -
        LOGISTICS_TAB_ORDER.indexOf(b.name as (typeof LOGISTICS_TAB_ORDER)[number]),
    );
  }, [state.routes, descriptors]);

  const focusedRouteKey = state.routes[state.index]?.key;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {visibleRoutes.map((route) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const focused = route.key === focusedRouteKey;
        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
          >
            <View style={[styles.indicator, focused && styles.indicatorActive]} />
            <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
              {label}
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
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  indicator: {
    width: 24,
    height: 2,
    borderRadius: 1,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: enterpriseColors.primary,
  },
  label: {
    fontSize: 10,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: enterpriseColors.primary,
    fontWeight: '600',
  },
});
