import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { growerUi } from '../../lib/grower-ui';

/** Fills space below tab header — children use flex to avoid empty gray area. */
export function TabRootBody({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[growerUi.tabRootBody, style]}>{children}</View>;
}
