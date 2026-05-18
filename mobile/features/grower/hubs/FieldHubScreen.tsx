import { useMemo } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  ListOrdered,
  Leaf,
  ClipboardList,
  Wheat,
  Sprout,
  Scan,
} from 'lucide-react-native';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { GrowerTabHeader } from '../../../components/grower/GrowerTabHeader';
import { useGrowerDashboard } from '../../../contexts/GrowerDashboardContext';
import { HubNavTile, HubSectionTitle } from './HubNavTile';
import { HubSummaryMetrics, type HubMetricRow } from './HubSummaryMetrics';

export default function FieldHubScreen() {
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
    return rows;
  }, [
    t,
    data.estates.length,
    data.parcelSteps.loaded,
    data.parcelSteps.approved,
    data.parcelSteps.total,
    data.offlinePending,
  ]);

  return (
    <ScrollView
      style={growerUi.canvas}
      contentContainerStyle={{ paddingBottom: Math.max(p.bottomInset, 16) + 12, flexGrow: 0 }}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={data.refreshing}
          onRefresh={() => void data.onRefresh()}
          tintColor={enterpriseColors.primary}
          colors={[enterpriseColors.primary]}
        />
      }
    >
      <GrowerTabHeader
        title={t('producer.hubs.field.title')}
        subtitle={t('producer.hubs.field.leadShort')}
        style={{ paddingTop: insets.top + 6 }}
      />

      <View style={growerUi.scrollContent}>
        <HubSummaryMetrics title={t('producer.hubs.metrics.summaryTitle')} rows={metricRows} />

        <HubSectionTitle>{t('producer.hubs.field.sectionFarm')}</HubSectionTitle>
      <HubNavTile
        title={t('producer.hubs.field.estatesTitle')}
        description={t('producer.hubs.field.estatesDesc')}
        icon={MapPin}
        onPress={() => router.push('/(producer)/estates')}
      />
      <HubNavTile
        title={t('producer.hubs.field.plotMapperTitle')}
        description={t('producer.hubs.field.plotMapperDesc')}
        icon={Scan}
        onPress={() => router.push('/(producer)/plot-mapper')}
      />

      <HubSectionTitle>{t('producer.hubs.field.sectionSeason')}</HubSectionTitle>
      <HubNavTile
        title={t('producer.hubs.field.plantingsTitle')}
        description={t('producer.hubs.field.plantingsDesc')}
        icon={Leaf}
        onPress={() => router.push('/(producer)/plantings')}
      />
      <HubNavTile
        title={t('producer.tabs.harvest')}
        description={t('producer.hubs.field.harvestDesc')}
        icon={Wheat}
        onPress={() => router.push('/(producer)/(tabs)/harvest')}
      />
      <HubNavTile
        title={t('producer.hubs.field.growthJournalTitle')}
        description={t('producer.hubs.field.growthJournalDesc')}
        icon={Sprout}
        onPress={() => router.push('/(producer)/growth-journal')}
      />

      <HubSectionTitle>{t('producer.hubs.field.sectionRecords')}</HubSectionTitle>
      <HubNavTile
        title={t('producer.tabs.fieldLog')}
        description={t('producer.hubs.field.fieldLogDesc')}
        icon={ClipboardList}
        onPress={() => router.push('/(producer)/(tabs)/field-log')}
      />

      <HubSectionTitle>{t('producer.hubs.field.sectionGuide')}</HubSectionTitle>
      <HubNavTile
        title={t('producer.tabs.steps')}
        description={t('producer.hubs.field.stepsDesc')}
        icon={ListOrdered}
        onPress={() => router.push('/(producer)/(tabs)/steps')}
      />
      </View>
    </ScrollView>
  );
}
