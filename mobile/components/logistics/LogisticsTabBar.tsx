import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { GrowerTabBar } from '../enterprise/GrowerTabBar';

const LOGISTICS_TAB_ORDER = ['index', 'missions', 'profile'] as const;

/** Same floating pill as the producer app, with the logistics tab set. */
export function LogisticsTabBar(props: BottomTabBarProps) {
  return <GrowerTabBar {...props} routeOrder={LOGISTICS_TAB_ORDER} />;
}
