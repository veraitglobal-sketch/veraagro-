import React, { useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  ListOrdered,
  Leaf,
  ClipboardList,
  Wheat,
  Sprout,
  Scan,
} from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useAuth } from '../../../hooks/useAuth';
import { useDashboardData } from '../dashboard/useDashboardData';
import { HubNavTile, HubSectionTitle } from './HubNavTile';
import { HubSummaryMetrics, type HubMetricRow } from './HubSummaryMetrics';

/**
 * Field / plot hub — everything tied to parcels and daily field work.
 */
export default function FieldHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const { user } = useAuth();
  const data = useDashboardData(user);

  const metricRows = useMemo((): HubMetricRow[] => {
    const rows: HubMetricRow[] = [
      {
        key: 'estates',
        label: t('producer.hubs.metrics.estates'),
        value: String(data.estates.length),
      },
    ];
    if (data.parcelSteps.loaded) {
      rows.push({
        key: 'parcels',
        label: t('producer.hubs.metrics.parcelsApproved'),
        value: t('producer.hubs.metrics.parcelsRatio', {
          approved: data.parcelSteps.approved,
          total: data.parcelSteps.total,
        }),
      });
    } else {
      rows.push({
        key: 'parcels',
        label: t('producer.hubs.metrics.parcelsApproved'),
        value: t('producer.hubs.metrics.loading'),
      });
    }
    if (data.offlinePending > 0) {
      rows.push({
        key: 'outbox',
        label: t('producer.hubs.metrics.outboxPending'),
        value: String(data.offlinePending),
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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          paddingTop: theme.spacing.md,
          paddingBottom: Math.max(p.bottomInset, theme.spacing.xl),
        }}
        refreshControl={
          <RefreshControl
            refreshing={data.refreshing}
            onRefresh={() => void data.onRefresh()}
            tintColor={theme.colors.text.secondary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: theme.colors.text.primary,
            marginBottom: 6,
          }}
        >
          {t('producer.hubs.field.title')}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.text.secondary,
            lineHeight: 20,
            marginBottom: theme.spacing.sm,
          }}
        >
          {t('producer.hubs.field.lead')}
        </Text>

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
      </ScrollView>
    </View>
  );
}
