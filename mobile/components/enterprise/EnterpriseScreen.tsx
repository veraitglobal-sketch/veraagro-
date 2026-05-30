import type { ReactNode } from 'react';
import {
  ScrollView,
  View,
  RefreshControl,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';
import { growerUi } from '../../lib/grower-ui';
import { bioVeraScrollProps, TAB_SCROLL_PADDING_BOTTOM } from '../../lib/scroll-view-props';

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
  contentPaddingBottom = TAB_SCROLL_PADDING_BOTTOM,
  withTopWash = false,
  contentContainerStyle,
  fillViewport = false,
}: Props) {
  const insets = useSafeAreaInsets();

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
        {...bioVeraScrollProps}
        contentContainerStyle={[
          {
            paddingBottom: contentPaddingBottom,
            ...(fillViewport ? { flexGrow: 1 } : {}),
          },
          contentContainerStyle,
        ]}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              progressViewOffset={insets.top}
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
