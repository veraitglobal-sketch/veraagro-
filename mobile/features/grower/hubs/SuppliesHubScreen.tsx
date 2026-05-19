import { useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Package, Box, ShoppingBag, Bell } from 'lucide-react-native';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { TabRootBody } from '../../../components/enterprise/TabRootBody';
import { EnterpriseNavSection } from '../../../components/enterprise/EnterpriseNavSection';
import { GrowerTabHeader } from '../../../components/grower/GrowerTabHeader';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useGrowerDashboard } from '../../../contexts/GrowerDashboardContext';
import { useGrowerTabRefresh } from '../../../hooks/useGrowerTabRefresh';
import { HubMetricsStrip } from './HubMetricsStrip';
import type { HubMetricRow } from './HubSummaryMetrics';

export default function SuppliesHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const data = useGrowerDashboard();
  const tabRefresh = useGrowerTabRefresh();

  const metricRows = useMemo((): HubMetricRow[] => {
    if (data.unreadCount <= 0) return [];
    return [
      {
        key: 'unread',
        type: 'count',
        label: t('producer.hubs.metrics.unreadNotifications'),
        count: data.unreadCount,
      },
    ];
  }, [t, data.unreadCount]);

  const items = [
    ...(data.unreadCount > 0
      ? [
          {
            key: 'notifications',
            title: t('producer.hubs.supplies.openNotifications', { count: data.unreadCount }),
            subtitle: t('producer.dashboard.nextStep.notificationsBody'),
            icon: Bell,
            onPress: () => router.push('/(producer)/notifications'),
          },
        ]
      : []),
    {
      key: 'products',
      title: t('producer.tabs.products'),
      subtitle: t('producer.hubs.supplies.productsDesc'),
      icon: Package,
      onPress: () => router.push('/(producer)/(tabs)/products'),
    },
    {
      key: 'materials',
      title: t('producer.dashboard.farmer.materialsTitle'),
      subtitle: t('producer.hubs.supplies.materialsDesc'),
      icon: Box,
      onPress: () => router.push('/(producer)/materials'),
    },
    {
      key: 'partners',
      title: t('navigation.partnerOrders'),
      subtitle: t('producer.hubs.supplies.partnerDesc'),
      icon: ShoppingBag,
      onPress: () => router.push('/(producer)/partner-orders'),
    },
  ];

  return (
    <EnterpriseScreen
      fillViewport
      withTopWash
      refreshing={tabRefresh.refreshing}
      onRefresh={() => void tabRefresh.onRefresh()}
      contentPaddingBottom={Math.max(p.bottomInset, 16) + 12}
      header={
        <GrowerTabHeader
          title={t('producer.hubs.supplies.title')}
          subtitle={t('producer.hubs.supplies.leadShort')}
        />
      }
    >
      <TabRootBody style={{ paddingTop: 8 }}>
        {metricRows.length > 0 ? <HubMetricsStrip rows={metricRows} /> : null}
        <EnterpriseNavSection title={t('producer.hubs.supplies.sectionCatalog')} items={items} />
      </TabRootBody>
    </EnterpriseScreen>
  );
}
