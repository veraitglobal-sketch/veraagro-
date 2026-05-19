import type { ReactNode } from 'react';
import {
  ScrollView,
  View,
  RefreshControl,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';
import { growerUi } from '../../lib/grower-ui';

type Props = {
  children: ReactNode;
  /** Fixed header above scroll body (e.g. GrowerTabHeader). */
  header?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentPaddingBottom?: number;
  /** Subtle green wash like welcome — use on Home tab only. */
  withTopWash?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * Grower in-app canvas — same gray-50 + white surfaces as welcome/login.
 * Farmer-friendly: vertical scroll, pull-to-refresh, no nested gestures.
 */
export function EnterpriseScreen({
  children,
  header,
  refreshing = false,
  onRefresh,
  contentPaddingBottom = 16,
  withTopWash = false,
  contentContainerStyle,
}: Props) {
  return (
    <View style={growerUi.canvas}>
      {withTopWash ? (
        <LinearGradient
          colors={['rgba(45, 90, 39, 0.07)', 'rgba(249, 250, 251, 0)']}
          style={enterpriseUi.screenTopWash}
          pointerEvents="none"
        />
      ) : null}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          { paddingBottom: contentPaddingBottom, flexGrow: 0 },
          contentContainerStyle,
        ]}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={enterpriseColors.primary}
              colors={[enterpriseColors.primary]}
            />
          ) : undefined
        }
      >
        {header}
        {children}
      </ScrollView>
    </View>
  );
}
