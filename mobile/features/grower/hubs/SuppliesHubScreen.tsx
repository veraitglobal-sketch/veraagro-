import { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Package, Box, ShoppingBag, Bell } from 'lucide-react-native';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { GrowerTabHeader } from '../../../components/grower/GrowerTabHeader';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useGrowerDashboard } from '../../../contexts/GrowerDashboardContext';
import { HubNavTile, HubSectionTitle } from './HubNavTile';
import { HubSummaryMetrics, type HubMetricRow } from './HubSummaryMetrics';

/**
 * Inputs: passport products, whitelist materials, partner B2B orders.
 */
export default function SuppliesHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = useBioVeraScreenPadding();
  const data = useGrowerDashboard();

  const metricRows = useMemo((): HubMetricRow[] => {
    const rows: HubMetricRow[] = [
      {
        key: 'estates',
        type: 'count',
        label: t('producer.hubs.metrics.estates'),
        count: data.estates.length,
      },
    ];
    if (data.unreadCount > 0) {
      rows.unshift({
        key: 'unread',
        type: 'count',
        label: t('producer.hubs.metrics.unreadNotifications'),
        count: data.unreadCount,
      });
    }
    return rows;
  }, [t, data.estates.length, data.unreadCount]);

  return (
    <EnterpriseScreen
      refreshing={data.refreshing}
      onRefresh={() => void data.onRefresh()}
      contentPaddingBottom={Math.max(p.bottomInset, 16) + 12}
      header={
        <GrowerTabHeader
          title={t('producer.hubs.supplies.title')}
          subtitle={t('producer.hubs.supplies.lead')}
          style={{ paddingTop: insets.top + 6 }}
        />
      }
    >
      <View style={growerUi.scrollContent}>
        <HubSummaryMetrics title={t('producer.hubs.metrics.summaryTitle')} rows={metricRows} />

        {data.unreadCount > 0 ? (
          <TouchableOpacity
            onPress={() => router.push('/(producer)/notifications')}
            activeOpacity={0.88}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: enterpriseColors.primaryTint,
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: 'rgba(45, 90, 39, 0.18)',
              gap: 12,
              minHeight: 56,
            }}
            accessibilityRole="button"
            accessibilityLabel={t('producer.hubs.supplies.openNotifications', {
              count: data.unreadCount,
            })}
          >
            <Bell size={24} color={enterpriseColors.primary} strokeWidth={1.75} />
            <Text
              style={{
                flex: 1,
                fontSize: 17,
                fontWeight: '600',
                color: enterpriseColors.primary,
                letterSpacing: -0.25,
              }}
            >
              {t('producer.hubs.supplies.openNotifications', { count: data.unreadCount })}
            </Text>
          </TouchableOpacity>
        ) : null}

        <HubSectionTitle>{t('producer.hubs.supplies.sectionCatalog')}</HubSectionTitle>
        <HubNavTile
          title={t('producer.tabs.products')}
          description={t('producer.hubs.supplies.productsDesc')}
          icon={Package}
          onPress={() => router.push('/(producer)/(tabs)/products')}
        />

        <HubSectionTitle>{t('producer.hubs.supplies.sectionCompliance')}</HubSectionTitle>
        <HubNavTile
          title={t('producer.dashboard.farmer.materialsTitle')}
          description={t('producer.hubs.supplies.materialsDesc')}
          icon={Box}
          onPress={() => router.push('/(producer)/materials')}
        />

        <HubSectionTitle>{t('producer.hubs.supplies.sectionPartners')}</HubSectionTitle>
        <HubNavTile
          title={t('navigation.partnerOrders')}
          description={t('producer.hubs.supplies.partnerDesc')}
          icon={ShoppingBag}
          onPress={() => router.push('/(producer)/partner-orders')}
        />
      </View>
    </EnterpriseScreen>
  );
}
