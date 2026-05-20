import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { TabRootBody } from '../../../components/enterprise/TabRootBody';
import { EnterpriseNavSection } from '../../../components/enterprise/EnterpriseNavSection';
import { GrowerTabShellHeader } from '../../../components/enterprise/GrowerTabShellHeader';
import { MapPin, ListOrdered, BookOpen, Leaf, ClipboardList, Wheat, Scan, Sprout } from 'lucide-react-native';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useGrowerDashboard } from '../../../contexts/GrowerDashboardContext';
import { useGrowerTabRefresh } from '../../../hooks/useGrowerTabRefresh';
import { HubMetricsStrip } from './HubMetricsStrip';
import type { HubMetricRow } from './HubSummaryMetrics';
import { parcelStatusLine } from '../dashboard/parcelStatusLine';

export default function FieldHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const data = useGrowerDashboard();
  const tabRefresh = useGrowerTabRefresh();
  const ps = data.parcelSteps;
  const estateCount = data.estates.length;

  const metricRows = useMemo((): HubMetricRow[] => {
    const rows: HubMetricRow[] = [
      {
        key: 'estates',
        type: 'count',
        label: t('producer.hubs.metrics.estates'),
        count: estateCount,
      },
      {
        key: 'parcels',
        type: 'ratio',
        label: t('producer.hubs.metrics.parcelsApproved'),
        approved: ps.loaded ? ps.approved : 0,
        total: ps.loaded ? ps.total : 0,
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
  }, [t, estateCount, ps.loaded, ps.approved, ps.total, data.offlinePending]);

  const statusLine = parcelStatusLine(t, estateCount, ps, 'producer.hubs.field.leadShort');

  return (
    <EnterpriseScreen
      fillViewport
      withTopWash
      refreshing={tabRefresh.refreshing}
      onRefresh={() => void tabRefresh.onRefresh()}
      contentPaddingBottom={Math.max(p.bottomInset, 16) + 12}
      header={
        <GrowerTabShellHeader
          eyebrow={t('producer.tabs.field')}
          title={t('producer.hubs.field.title')}
          statusLine={statusLine}
        />
      }
    >
      <TabRootBody style={{ paddingTop: 0 }}>
        <HubMetricsStrip rows={metricRows} />

        <EnterpriseNavSection
          title={t('producer.hubs.field.sectionRecords')}
          items={[
            {
              key: 'field-log',
              title: t('producer.tabs.fieldLog'),
              subtitle: t('producer.hubs.field.fieldLogDesc'),
              icon: ClipboardList,
              onPress: () => router.push('/(producer)/(tabs)/field-log'),
            },
          ]}
        />

        <EnterpriseNavSection
          title={t('producer.hubs.field.sectionFarm')}
          items={[
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
          ]}
        />

        <EnterpriseNavSection
          title={t('producer.hubs.field.sectionSeason')}
          items={[
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
          ]}
        />

        <EnterpriseNavSection
          title={t('producer.hubs.field.sectionGuide')}
          items={[
            {
              key: 'steps',
              title: t('producer.tabs.steps'),
              subtitle: t('producer.hubs.field.stepsDesc'),
              icon: ListOrdered,
              onPress: () => router.push('/(producer)/(tabs)/steps'),
            },
            {
              key: 'app-guide',
              title: t('producer.appGuide.cardTitle'),
              subtitle: t('producer.appGuide.cardBody'),
              icon: BookOpen,
              onPress: () => router.push('/(producer)/app-guide'),
            },
          ]}
        />
      </TabRootBody>
    </EnterpriseScreen>
  );
}
