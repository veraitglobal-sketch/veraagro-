import React, { useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Package, Box, ShoppingBag, Bell } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
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
          {t('producer.hubs.supplies.title')}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.text.secondary,
            lineHeight: 20,
            marginBottom: theme.spacing.sm,
          }}
        >
          {t('producer.hubs.supplies.lead')}
        </Text>

        <HubSummaryMetrics title={t('producer.hubs.metrics.summaryTitle')} rows={metricRows} />

        {data.unreadCount > 0 ? (
          <TouchableOpacity
            onPress={() => router.push('/(producer)/notifications')}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.primaryLight,
              borderRadius: theme.borderRadius.md,
              paddingVertical: 12,
              paddingHorizontal: theme.spacing.md,
              marginBottom: theme.spacing.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              gap: 10,
            }}
          >
            <Bell size={22} color={theme.colors.primary} strokeWidth={1.75} />
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: theme.colors.primary }}>
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
      </ScrollView>
    </View>
  );
}
