import React, { useMemo } from 'react';
import { View } from 'react-native';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Package,
  Camera,
  ClipboardCheck,
  QrCode,
  ScanBarcode,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useGrowerDashboard } from '../../../contexts/GrowerDashboardContext';
import { GrowerTabHeader } from '../../../components/grower/GrowerTabHeader';
import { EnterpriseListPanel } from '../../../components/grower/EnterpriseListPanel';
import { growerUi } from '../../../lib/grower-ui';
import { HubNavTile, HubSectionTitle } from './HubNavTile';
import { HubSummaryMetrics, type HubMetricRow } from './HubSummaryMetrics';

/**
 * Lots, quality, compliance, transport — same order as web grower nav.
 */
export default function ChainHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = useBioVeraScreenPadding();
  const data = useGrowerDashboard();

  const transportItems = [
    {
      key: 'create',
      label: t('navigation.requestTransport'),
      onPress: () => router.push('/(producer)/missions-create'),
    },
    {
      key: 'list',
      label: t('producer.hubs.chain.missionsTitle'),
      onPress: () => router.push('/(producer)/missions'),
    },
  ];

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
      refreshing={data.refreshing}
      onRefresh={() => void data.onRefresh()}
      contentPaddingBottom={Math.max(p.bottomInset, 16) + 12}
      header={
        <GrowerTabHeader
          title={t('producer.hubs.chain.title')}
          subtitle={t('producer.hubs.chain.leadShort')}
          style={{ paddingTop: insets.top + 6 }}
        />
      }
    >
      <View style={growerUi.scrollContent}>
        <HubSummaryMetrics title={t('producer.hubs.metrics.summaryTitle')} rows={metricRows} />

        <HubSectionTitle>{t('producer.hubs.chain.sectionLots')}</HubSectionTitle>
        <HubNavTile
          title={t('producer.tabs.batches')}
          description={t('producer.hubs.chain.batchesDesc')}
          icon={Package}
          onPress={() => router.push('/(producer)/batches')}
        />
        <HubNavTile
          title={t('navigation.packingFlow')}
          description={t('producer.hubs.chain.packingDesc')}
          icon={Camera}
          onPress={() => router.push('/(producer)/packing-flow')}
        />

        <HubSectionTitle>{t('producer.hubs.chain.sectionQuality')}</HubSectionTitle>
        <HubNavTile
          title={t('producer.hubs.chain.qualityTitle')}
          description={t('producer.hubs.chain.qualityDesc')}
          icon={ClipboardCheck}
          onPress={() => router.push('/(producer)/quality-entry')}
        />
        <HubNavTile
          title={t('producer.hubs.chain.complianceTitle')}
          description={t('producer.hubs.chain.complianceDesc')}
          icon={Camera}
          onPress={() => router.push('/(producer)/compliance-photos')}
        />

        <HubSectionTitle>{t('producer.hubs.chain.sectionTransport')}</HubSectionTitle>
        <EnterpriseListPanel items={transportItems} />

        <HubSectionTitle>{t('producer.hubs.chain.sectionBadges')}</HubSectionTitle>
        <HubNavTile
          title={t('navigation.packageBadges')}
          description={t('producer.hubs.chain.badgesDesc')}
          icon={QrCode}
          onPress={() => router.push('/(producer)/package-badges')}
        />
        <HubNavTile
          title={t('navigation.scanBarcode')}
          description={t('producer.hubs.chain.scanDesc')}
          icon={ScanBarcode}
          onPress={() => router.push({ pathname: '/(producer)/scanner', params: { returnTo: 'products' } })}
        />
      </View>
    </EnterpriseScreen>
  );
}
