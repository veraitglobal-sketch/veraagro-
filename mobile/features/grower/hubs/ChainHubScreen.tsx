import { useMemo } from 'react';
import { View } from 'react-native';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { TabRootBody } from '../../../components/enterprise/TabRootBody';
import { EnterpriseNavSection } from '../../../components/enterprise/EnterpriseNavSection';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Package, Camera, ClipboardCheck, Truck, QrCode, ScanBarcode } from 'lucide-react-native';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useGrowerDashboard } from '../../../contexts/GrowerDashboardContext';
import { useGrowerTabRefresh } from '../../../hooks/useGrowerTabRefresh';
import { GrowerTabHeader } from '../../../components/grower/GrowerTabHeader';
import { BioVeraChainTraceStrip } from '../../../components/enterprise/BioVeraChainTraceStrip';
import { HubMetricsStrip } from './HubMetricsStrip';
import type { HubMetricRow } from './HubSummaryMetrics';

export default function ChainHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const data = useGrowerDashboard();
  const tabRefresh = useGrowerTabRefresh();

  const metricRows = useMemo((): HubMetricRow[] => {
    return [
      {
        key: 'lots',
        type: 'count',
        label: t('producer.hubs.metrics.lotsTotal'),
        count: data.batchTotalCount,
      },
      {
        key: 'ready',
        type: 'count',
        label: t('producer.hubs.metrics.lotsReady'),
        count: data.batchesReadyForTransport,
      },
      {
        key: 'missions',
        type: 'count',
        label: t('producer.hubs.metrics.missionsActive'),
        count: data.activeMissions.length,
      },
    ];
  }, [t, data.batchTotalCount, data.batchesReadyForTransport, data.activeMissions.length]);

  return (
    <EnterpriseScreen
      fillViewport
      withTopWash
      refreshing={tabRefresh.refreshing}
      onRefresh={() => void tabRefresh.onRefresh()}
      contentPaddingBottom={Math.max(p.bottomInset, 16) + 12}
      header={
        <GrowerTabHeader
          title={t('producer.hubs.chain.title')}
          subtitle={t('producer.hubs.chain.leadShort')}
        />
      }
    >
      <TabRootBody>
        <BioVeraChainTraceStrip
          parcelCount={data.parcelSteps.loaded ? data.parcelSteps.total : 0}
          lotCount={data.batchTotalCount}
          lotsReady={data.batchesReadyForTransport}
          activeMissions={data.activeMissions.length}
          hasTransportRecord={data.hasTransportRecord}
        />
        <HubMetricsStrip rows={metricRows} />
        <EnterpriseNavSection
          title={t('producer.hubs.chain.sectionLots')}
          items={[
              {
                key: 'batches',
                title: t('producer.tabs.batches'),
                subtitle: t('producer.hubs.chain.batchesDesc'),
                icon: Package,
                onPress: () => router.push('/(producer)/batches'),
              },
              {
                key: 'packing',
                title: t('navigation.packingFlow'),
                subtitle: t('producer.hubs.chain.packingDesc'),
                icon: Camera,
                onPress: () => router.push('/(producer)/packing-flow'),
              },
              {
                key: 'quality',
                title: t('producer.hubs.chain.qualityTitle'),
                subtitle: t('producer.hubs.chain.qualityDesc'),
                icon: ClipboardCheck,
                onPress: () => router.push('/(producer)/quality-entry'),
              },
              {
                key: 'compliance',
                title: t('producer.hubs.chain.complianceTitle'),
                subtitle: t('producer.hubs.chain.complianceDesc'),
                icon: Camera,
                onPress: () => router.push('/(producer)/compliance-photos'),
              },
              {
                key: 'create',
                title: t('navigation.requestTransport'),
                subtitle: t('producer.hubs.chain.sectionTransport'),
                icon: Truck,
                onPress: () => router.push('/(producer)/missions-create'),
              },
              {
                key: 'missions',
                title: t('producer.hubs.chain.missionsTitle'),
                subtitle: t('producer.hubs.chain.batchesDesc'),
                icon: Package,
                onPress: () => router.push('/(producer)/missions'),
              },
              {
                key: 'badges',
                title: t('navigation.packageBadges'),
                subtitle: t('producer.hubs.chain.badgesDesc'),
                icon: QrCode,
                onPress: () => router.push('/(producer)/package-badges'),
              },
              {
                key: 'scan',
                title: t('navigation.scanBarcode'),
                subtitle: t('producer.hubs.chain.scanDesc'),
                icon: ScanBarcode,
                onPress: () =>
                  router.push({ pathname: '/(producer)/scanner', params: { returnTo: 'products' } }),
              },
            ]}
        />
      </TabRootBody>
    </EnterpriseScreen>
  );
}
