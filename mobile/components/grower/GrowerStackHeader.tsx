import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { enterpriseColors } from '../../lib/enterprise-ui';
import { growerUi } from '../../lib/grower-ui';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
};

/** Stack screen header — enterprise back + light title (no heavy icons). */
export function GrowerStackHeader({ title, subtitle, onBack }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity
        onPress={onBack ?? (() => router.back())}
        activeOpacity={0.65}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <ChevronLeft size={22} color={enterpriseColors.gray900} strokeWidth={1.5} />
      </TouchableOpacity>
      <View style={styles.titles}>
        <Text style={growerUi.pageTitle} numberOfLines={2} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text style={growerUi.pageLead} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    backgroundColor: enterpriseColors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  back: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  titles: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
    paddingTop: 6,
  },
});
