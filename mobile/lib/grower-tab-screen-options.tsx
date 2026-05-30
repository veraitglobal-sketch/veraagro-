import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Home, Sprout, Package, ShoppingBag, User } from 'lucide-react-native';
import type { ComponentType } from 'react';

type TabIconProps = { color: string; size?: number; focused?: boolean };

function TabHomeIcon({ color, size }: TabIconProps) {
  return <Home size={size || 22} color={color} strokeWidth={1.5} />;
}
function TabFieldIcon({ color, size }: TabIconProps) {
  return <Sprout size={size || 22} color={color} strokeWidth={1.5} />;
}
function TabChainIcon({ color, size }: TabIconProps) {
  return <Package size={size || 22} color={color} strokeWidth={1.5} />;
}
function TabSuppliesIcon({ color, size }: TabIconProps) {
  return <ShoppingBag size={size || 22} color={color} strokeWidth={1.5} />;
}
function TabProfileIcon({ color, size }: TabIconProps) {
  return <User size={size || 22} color={color} strokeWidth={1.5} />;
}

type TabIconComponent = ComponentType<TabIconProps>;

/** i18n keys — labels resolved in GrowerTabBar (avoids unstable options in _layout). */
export const GROWER_TAB_LABEL_KEYS: Record<string, string> = {
  index: 'producer.tabs.home',
  field: 'producer.tabs.field',
  chain: 'producer.tabs.chain',
  supplies: 'producer.tabs.supplies',
  profile: 'producer.tabs.profile',
};

const MAIN_TAB_ICONS: Record<string, TabIconComponent> = {
  index: TabHomeIcon,
  field: TabFieldIcon,
  chain: TabChainIcon,
  supplies: TabSuppliesIcon,
  profile: TabProfileIcon,
};

/** Module-level stable screen options — never recreated on render. */
export const GROWER_MAIN_TAB_OPTIONS: Record<string, BottomTabNavigationOptions> = {
  index: { headerShown: false, tabBarIcon: TabHomeIcon },
  field: { headerShown: false, tabBarIcon: TabFieldIcon },
  chain: { headerShown: false, tabBarIcon: TabChainIcon },
  supplies: { headerShown: false, tabBarIcon: TabSuppliesIcon },
  profile: { headerShown: false, tabBarIcon: TabProfileIcon },
};

type HiddenTabOptions = BottomTabNavigationOptions & { href: null };

export const GROWER_HIDDEN_TAB_OPTIONS: Record<string, HiddenTabOptions> = {
  steps: { href: null },
  products: { href: null },
  'cost-calculator': { href: null },
  certifications: { href: null },
  'banned-substances': { href: null },
  'field-log': { href: null },
  harvest: { href: null },
  settings: { href: null },
};

export function growerTabIconForRoute(routeName: string): TabIconComponent | undefined {
  return MAIN_TAB_ICONS[routeName];
}
