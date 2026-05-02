import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';

/**
 * Legacy entry: old "Farm tools" list moved into Field / Chain / Supplies tabs.
 * @see docs/GROWER_MOBILE_IA_REDESIGN.md
 */
export default function FarmToolsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingHorizontal: p.screenPaddingLeft,
        paddingRight: p.screenPaddingRight,
        paddingTop: theme.spacing.lg,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 }}>
        {t('producer.dashboard.legacyFarmToolsTitle')}
      </Text>
      <Text
        style={{
          fontSize: 15,
          color: theme.colors.text.secondary,
          lineHeight: 22,
          marginBottom: theme.spacing.lg,
        }}
      >
        {t('producer.dashboard.legacyFarmToolsBody')}
      </Text>
      {(
        [
          { key: 'field', label: t('producer.tabs.field'), path: '/(producer)/(tabs)/field' as const },
          { key: 'chain', label: t('producer.tabs.chain'), path: '/(producer)/(tabs)/chain' as const },
          { key: 'sup', label: t('producer.tabs.supplies'), path: '/(producer)/(tabs)/supplies' as const },
        ] as const
      ).map((item) => (
        <TouchableOpacity
          key={item.key}
          onPress={() => router.replace(item.path)}
          activeOpacity={0.75}
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.md,
            paddingVertical: 14,
            paddingHorizontal: theme.spacing.md,
            marginBottom: theme.spacing.sm,
            minHeight: 52,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.inverse }}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
