import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enterpriseUi } from '../../lib/enterprise-ui';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Tab header — safe area below status bar, then title (scrolls with content). */
export function GrowerTabHeader({ title, subtitle, right, style }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: insets.top + 6 },
        style,
      ]}
    >
      <View style={styles.mainRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={enterpriseUi.inAppTitle} numberOfLines={2} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text style={enterpriseUi.inAppLead} numberOfLines={3}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  right: {
    flexShrink: 0,
    paddingTop: 4,
  },
});
