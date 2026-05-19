import { useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { TabRootBody } from '../../../components/enterprise/TabRootBody';
import { EnterpriseNavSection } from '../../../components/enterprise/EnterpriseNavSection';
import { MapPin, ListOrdered, Leaf, ClipboardList, Wheat, Scan, Sprout } from 'lucide-react-native';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { GrowerTabHeader } from '../../../components/grower/GrowerTabHeader';
import { useGrowerDashboard } from '../../../contexts/GrowerDashboardContext';
import { useGrowerTabRefresh } from '../../../hooks/useGrowerTabRefresh';
import { HubMetricsStrip } from './HubMetricsStrip';
import type { HubMetricRow } from './HubSummaryMetrics';

export default function FieldHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const data = useGrowerDashboard();
  const tabRefresh = useGrowerTabRefresh();

  const metricRows = useMemo((): HubMetricRow[] => {
    const rows: HubMetricRow[] = [
      {
        key: 'estates',
        type: 'count',
        label: t('producer.hubs.metrics.estates'),
        count: data.estates.length,
      },
      {
        key: 'parcels',
        type: 'ratio',
        label: t('producer.hubs.metrics.parcelsApproved'),
        approved: data.parcelSteps.loaded ? data.parcelSteps.approved : 0,
        total: data.parcelSteps.loaded ? data.parcelSteps.total : 0,
        animate: data.parcelSteps.loaded,
      },
    ];
    if (data.offlinePending > 0) {
      rows.push({
        key: 'outbox',
        type: 'count',
        label: t('producer.hubs.metrics.outboxPending'),
        count: data.offlinePending,
      });
    }
    return rows.slice(0, 3);
  }, [
    t,
    data.estates.length,
    data.parcelSteps.loaded,
    data.parcelSteps.approved,
    data.parcelSteps.total,
    data.offlinePending,
  ]);

  return (
    <EnterpriseScreen
      fillViewport
      withTopWash
      refreshing={tabRefresh.refreshing}
      onRefresh={() => void tabRefresh.onRefresh()}
      contentPaddingBottom={Math.max(p.bottomInset, 16) + 12}
      header={
        <GrowerTabHeader
          title={t('producer.hubs.field.title')}
          subtitle={t('producer.hubs.field.leadShort')}
        />
      }
    >
      <TabRootBody>
        <HubMetricsStrip rows={metricRows} />
        <EnterpriseNavSection
          title={t('producer.hubs.field.sectionFarm')}
          items={[
              {
                key: 'field-log',
                title: t('producer.tabs.fieldLog'),
                subtitle: t('producer.hubs.field.fieldLogDesc'),
                icon: ClipboardList,
                onPress: () => router.push('/(producer)/(tabs)/field-log'),
              },
              {
                key: 'estates',
                title: t('producer.hubs.field.estatesTitle'),
                subtitle: t('producer.hubs.field.estatesDesc'),
                icon: MapPin,
                onPress: () => router.push('/(producer)/estates'),
              },
              {
                key: 'plot',
                title: t('producer.hubs.field.plotMapperTitle'),
                subtitle: t('producer.hubs.field.plotMapperDesc'),
                icon: Scan,
                onPress: () => router.push('/(producer)/plot-mapper'),
              },
              {
                key: 'plantings',
                title: t('producer.hubs.field.plantingsTitle'),
                subtitle: t('producer.hubs.field.plantingsDesc'),
                icon: Leaf,
                onPress: () => router.push('/(producer)/plantings'),
              },
              {
                key: 'harvest',
                title: t('producer.tabs.harvest'),
                subtitle: t('producer.hubs.field.harvestDesc'),
                icon: Wheat,
                onPress: () => router.push('/(producer)/(tabs)/harvest'),
              },
              {
                key: 'journal',
                title: t('producer.hubs.field.growthJournalTitle'),
                subtitle: t('producer.hubs.field.growthJournalDesc'),
                icon: Sprout,
                onPress: () => router.push('/(producer)/growth-journal'),
              },
              {
                key: 'steps',
                title: t('producer.tabs.steps'),
                subtitle: t('producer.hubs.field.stepsDesc'),
                icon: ListOrdered,
                onPress: () => router.push('/(producer)/(tabs)/steps'),
              },
            ]}
        />
      </TabRootBody>
    </EnterpriseScreen>
  );
}
