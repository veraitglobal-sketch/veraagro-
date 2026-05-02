import React, { useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Package,
  Camera,
  ClipboardCheck,
  Truck,
  ListChecks,
  QrCode,
  ScanBarcode,
} from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useAuth } from '../../../hooks/useAuth';
import { useDashboardData } from '../dashboard/useDashboardData';
import { HubNavTile, HubSectionTitle } from './HubNavTile';
import { HubSummaryMetrics, type HubMetricRow } from './HubSummaryMetrics';

/**
 * Lots, quality, compliance, transport — same order as web grower nav.
 */
export default function ChainHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const { user } = useAuth();
  const data = useDashboardData(user);

  const metricRows = useMemo((): HubMetricRow[] => {
    return [
      {
        key: 'lots',
        label: t('producer.hubs.metrics.lotsTotal'),
        value: String(data.batchTotalCount),
      },
      {
        key: 'ready',
        label: t('producer.hubs.metrics.lotsReady'),
        value: String(data.batchesReadyForTransport),
      },
      {
        key: 'missions',
        label: t('producer.hubs.metrics.missionsActive'),
        value: String(data.activeMissions.length),
      },
    ];
  }, [t, data.batchTotalCount, data.batchesReadyForTransport, data.activeMissions.length]);

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
          {t('producer.hubs.chain.title')}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.text.secondary,
            lineHeight: 20,
            marginBottom: theme.spacing.sm,
          }}
        >
          {t('producer.hubs.chain.lead')}
        </Text>

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
        <HubNavTile
          title={t('navigation.requestTransport')}
          description={t('producer.hubs.chain.transportDesc')}
          icon={Truck}
          onPress={() => router.push('/(producer)/missions-create')}
        />
        <HubNavTile
          title={t('producer.hubs.chain.missionsTitle')}
          description={t('producer.hubs.chain.missionsDesc')}
          icon={ListChecks}
          onPress={() => router.push('/(producer)/missions')}
        />

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
      </ScrollView>
    </View>
  );
}
