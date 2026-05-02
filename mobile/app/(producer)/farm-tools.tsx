import { ScrollView, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import FarmerHomeSection from '../../features/grower/dashboard/FarmerHomeSection';

/**
 * Full list of farm shortcuts — moved off Home to reduce scroll on the dashboard tab.
 */
export default function FarmToolsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();

  const handlers = {
    onParcels: () => router.push('/(producer)/estates'),
    onPlantingSteps: () => router.push('/(producer)/(tabs)/steps'),
    onPlantings: () => router.push('/(producer)/plantings'),
    onFieldDiary: () => router.push('/(producer)/(tabs)/field-log'),
    onAllowedMaterials: () => router.push('/(producer)/materials'),
    onBanned: () => router.push('/(producer)/(tabs)/banned-substances'),
    onCertificates: () => router.push('/(producer)/(tabs)/certifications'),
    onMyProducts: () => router.push('/(producer)/(tabs)/products'),
    onScan: () => router.push({ pathname: '/(producer)/scanner', params: { returnTo: 'products' } }),
    onHarvest: () => router.push('/(producer)/(tabs)/harvest'),
    onCompliancePhotos: () => router.push('/(producer)/compliance-photos'),
    onQuality: () => router.push('/(producer)/quality-entry'),
    onPartnerOrders: () => router.push('/(producer)/partner-orders'),
    onBatches: () => router.push('/(producer)/batches'),
    onMaterials: () => router.push('/(producer)/materials'),
    onRequestTransport: () => router.push('/(producer)/missions-create'),
    onMissions: () => router.push('/(producer)/missions'),
    onPackageBadges: () => router.push('/(producer)/package-badges'),
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          paddingTop: theme.spacing.md,
          paddingBottom: Math.max(p.bottomInset, theme.spacing.xl),
        }}
      >
        <Text
          style={{
            fontSize: 13,
            color: theme.colors.text.secondary,
            lineHeight: 18,
            marginBottom: theme.spacing.md,
          }}
        >
          {t('producer.dashboard.farmToolsCardSubtitle')}
        </Text>
        <FarmerHomeSection handlers={handlers} variant="farmTools" />
        <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, lineHeight: 17, marginTop: theme.spacing.sm }}>
          {t('producer.dashboard.farmer.profileMore')}
        </Text>
      </ScrollView>
    </View>
  );
}
