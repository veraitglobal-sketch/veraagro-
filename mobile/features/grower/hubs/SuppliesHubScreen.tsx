import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Package, Box, ShoppingBag, Bell, MapPinned, Calculator } from 'lucide-react-native';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { TabRootBody } from '../../../components/enterprise/TabRootBody';
import { EnterpriseNavSection } from '../../../components/enterprise/EnterpriseNavSection';
import { GrowerTabShellHeader } from '../../../components/enterprise/GrowerTabShellHeader';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useGrowerDashboard } from '../../../contexts/GrowerDashboardContext';
import { useGrowerTabRefresh } from '../../../hooks/useGrowerTabRefresh';
import { HubMetricsStrip } from './HubMetricsStrip';
import type { HubMetricRow } from './HubSummaryMetrics';
import { suppliesStatusLine } from './suppliesStatusLine';
import { SuppliesHubOrdersPreview } from './SuppliesHubOrdersPreview';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import type { SuppliesSnapshot } from './fetchSuppliesSnapshot';

const EMPTY_SNAPSHOT: SuppliesSnapshot = {
  materialsCount: 0,
  productsCount: 0,
  partnerOrdersOpen: 0,
  partnerOrdersAwaitingReceive: 0,
  partnerOrdersPending: 0,
  partnerOrdersTotal: 0,
  recentOrders: [],
};

export default function SuppliesHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const data = useGrowerDashboard();
  const tabRefresh = useGrowerTabRefresh();

  const unread = data.unreadCount;
  const snap = data.suppliesSnapshot ?? EMPTY_SNAPSHOT;
  const snapLoaded = data.suppliesSnapshotLoaded;

  const statusLine = suppliesStatusLine(t, unread, data.suppliesSnapshot, snapLoaded);

  const metricRows = useMemo((): HubMetricRow[] => {
    const materials = snapLoaded ? snap.materialsCount : 0;
    const orders = snapLoaded ? snap.partnerOrdersOpen : 0;
    const products = snapLoaded ? snap.productsCount : 0;
    return [
      {
        key: 'materials',
        type: 'count',
        label: t('producer.dashboard.farmer.materialsTitle'),
        count: materials,
      },
      {
        key: 'orders',
        type: 'count',
        label: t('producer.hubs.supplies.metricOrdersOpen'),
        count: orders,
      },
      {
        key: 'products',
        type: 'count',
        label: t('producer.hubs.supplies.productsTitle'),
        count: products,
      },
    ];
  }, [t, snap, snapLoaded]);

  const inboxItems = useMemo(
    () =>
      unread > 0
        ? [
            {
              key: 'notifications',
              title: t('producer.hubs.supplies.openNotifications', { count: unread }),
              subtitle: t('producer.dashboard.nextStep.notificationsBody'),
              icon: Bell,
              onPress: () => router.push('/(producer)/notifications'),
            },
          ]
        : [],
    [t, router, unread],
  );

  const fieldItems = useMemo(
    () => [
      {
        key: 'materials',
        title: t('producer.dashboard.farmer.materialsTitle'),
        subtitle: t('producer.hubs.supplies.materialsDesc'),
        icon: Box,
        onPress: () => router.push('/(producer)/materials'),
      },
      {
        key: 'costs',
        title: t('producer.costCalculator.title'),
        subtitle: t('producer.dashboard.costCalculatorDesc'),
        icon: Calculator,
        onPress: () => router.push('/(producer)/(tabs)/cost-calculator'),
      },
    ],
    [t, router],
  );

  const offerItems = useMemo(
    () => [
      {
        key: 'products',
        title: t('producer.hubs.supplies.productsTitle'),
        subtitle: t('producer.hubs.supplies.productsDesc'),
        icon: Package,
        onPress: () => router.push('/(producer)/(tabs)/products'),
      },
    ],
    [t, router],
  );

  return (
    <EnterpriseScreen
      fillViewport
      withTopWash
      refreshing={tabRefresh.refreshing}
      onRefresh={() => void tabRefresh.onRefresh()}
      contentPaddingBottom={Math.max(p.bottomInset, 16) + 12}
      header={
        <GrowerTabShellHeader
          eyebrow={t('producer.tabs.supplies')}
          title={t('producer.hubs.supplies.title')}
          statusLine={statusLine}
        />
      }
    >
      <TabRootBody style={{ paddingTop: 0 }}>
        <HubMetricsStrip rows={metricRows} />

        <TouchableOpacity
          onPress={() => router.push('/map' as Href)}
          activeOpacity={0.72}
          style={[enterpriseUi.inAppPanel, styles.mapRow]}
          accessibilityRole="button"
          accessibilityLabel={t('producer.dashboard.suppliersMap')}
        >
          <View style={enterpriseUi.navRowIcon}>
            <MapPinned size={20} color={enterpriseColors.primary} strokeWidth={1.5} />
          </View>
          <View style={styles.mapCopy}>
            <Text style={enterpriseUi.navRowTitle}>{t('producer.dashboard.suppliersMap')}</Text>
            <Text style={enterpriseUi.navRowSubtitle}>{t('producer.dashboard.suppliersMapDesc')}</Text>
          </View>
        </TouchableOpacity>

        <SuppliesHubOrdersPreview
          loaded={snapLoaded}
          orders={snapLoaded ? snap.recentOrders : []}
          totalCount={snapLoaded ? snap.partnerOrdersTotal : 0}
        />

        {inboxItems.length > 0 ? <EnterpriseNavSection items={inboxItems} /> : null}

        <EnterpriseNavSection
          title={t('producer.hubs.supplies.sectionInputs')}
          items={fieldItems}
        />

        <EnterpriseNavSection
          title={t('producer.hubs.supplies.sectionOffer')}
          items={offerItems}
        />
      </TabRootBody>
    </EnterpriseScreen>
  );
}

const styles = StyleSheet.create({
  mapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 18,
    gap: 4,
  },
  mapCopy: {
    flex: 1,
    minWidth: 0,
  },
});
