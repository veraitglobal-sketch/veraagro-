import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '../../design-system/BackButton';
import { enterpriseColors } from '../../lib/enterprise-ui';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

/** Stack screen header — enterprise back + light title (no heavy icons). */
export function GrowerStackHeader({ title, subtitle, onBack, right }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <BackButton onPress={onBack ?? (() => router.back())} style={styles.back} />
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={2} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right != null ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: -0.45, color: enterpriseColors.gray900 },
  subtitle: { fontSize: 13, lineHeight: 18, marginTop: 2, color: enterpriseColors.gray600 },
  bar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: enterpriseColors.canvas,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  back: {
    marginTop: 1,
  },
  right: {
    marginTop: 1,
  },
  titles: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
    paddingTop: 5,
  },
});
