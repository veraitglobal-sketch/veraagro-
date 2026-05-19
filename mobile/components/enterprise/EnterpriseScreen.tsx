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
  header?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentPaddingBottom?: number;
  withTopWash?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Tab roots: stretch canvas when content is short; always allow scroll when tall. */
  fillViewport?: boolean;
};

export function EnterpriseScreen({
  children,
  header,
  refreshing = false,
  onRefresh,
  contentPaddingBottom = 16,
  withTopWash = false,
  contentContainerStyle,
  fillViewport = false,
}: Props) {
  return (
    <View style={growerUi.canvas}>
      {withTopWash ? (
        <LinearGradient
          colors={['rgba(45, 90, 39, 0.055)', 'rgba(249, 250, 251, 0)']}
          style={enterpriseUi.screenTopWash}
          pointerEvents="none"
        />
      ) : null}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          { paddingBottom: contentPaddingBottom, flexGrow: fillViewport ? 1 : 0 },
          contentContainerStyle,
        ]}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
