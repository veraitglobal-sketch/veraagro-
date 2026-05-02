import React from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronRight, LayoutGrid } from 'lucide-react-native';
import { useAuth } from '../../../hooks/useAuth';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useDashboardData } from './useDashboardData';
import DashboardHeader from './DashboardHeader';
import NextStepCard from './NextStepCard';
import SyncQueueStrip from './SyncQueueStrip';
import DashboardHomeFinanceTeaser from './DashboardHomeFinanceTeaser';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const data = useDashboardData(user);

  const farmName = data.estates[0]?.name || t('producer.dashboard.defaultFarmName');

  const estateCount = data.estates.length;
  const ps = data.parcelSteps;

  const hasAlerts =
    data.unreadCount > 0 || data.activeMissions.length > 0 || data.activeBatches.length > 0;

  const alertLine =
    hasAlerts
      ? [
          data.unreadCount > 0
            ? t('producer.dashboard.farmer.alertMsg', { count: data.unreadCount })
            : null,
          data.activeMissions.length > 0
            ? t('producer.dashboard.farmer.alertMissions', { count: data.activeMissions.length })
            : null,
          data.activeBatches.length > 0
            ? t('producer.dashboard.farmer.alertBatches', { count: data.activeBatches.length })
            : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : '';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={data.refreshing}
          onRefresh={data.onRefresh}
          tintColor={theme.colors.text.secondary}
          colors={[theme.colors.primary]}
        />
      }
    >
      <DashboardHeader
        farmName={farmName}
        partnerCode={user?.partnerCode}
        connected={data.connected}
      />
      <View
        style={{
          paddingTop: theme.spacing.sm,
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          paddingBottom: Math.max(p.bottomInset, theme.spacing.md),
        }}
      >
        <SyncQueueStrip
          pendingCount={data.offlinePending}
          syncing={data.offlineSyncing}
          lastError={data.offlineSyncLastError}
          onOpenFieldLog={() => router.push('/(producer)/(tabs)/field-log')}
          onSyncNow={() => void data.onRefresh()}
          compact
        />
        <NextStepCard
          ready={ps.loaded}
          estateCount={estateCount}
          totalParcels={ps.total}
          pendingApproval={ps.pending}
          approved={ps.approved}
          activeMissions={data.activeMissions.length}
          offlinePending={data.offlinePending}
          batchesReadyForTransport={data.batchesReadyForTransport}
          onAddField={() => router.push('/(producer)/estates/new')}
          onAddParcel={() => router.push('/(producer)/estates')}
          onMissions={() => router.push('/(producer)/missions')}
          onRequestTransport={() => router.push('/(producer)/missions-create')}
          onSteps={() => router.push('/(producer)/(tabs)/steps')}
          onFieldLog={() => router.push('/(producer)/(tabs)/field-log')}
        />
        <DashboardHomeFinanceTeaser
          data={data.ordersFinancial}
          onPress={() => router.push('/(producer)/(tabs)/wallet')}
        />
        <TouchableOpacity
          onPress={() => router.push('/(producer)/farm-tools')}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: theme.borderRadius.md,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            marginBottom: theme.spacing.sm,
            borderWidth: 1,
            borderColor: theme.colors.border,
            minHeight: 52,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: theme.spacing.sm,
            }}
          >
            <LayoutGrid size={22} color={theme.colors.primary} strokeWidth={1.75} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text.primary }}>
              {t('producer.dashboard.farmToolsCardTitle')}
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 }} numberOfLines={2}>
              {t('producer.dashboard.farmToolsCardSubtitle')}
            </Text>
          </View>
          <ChevronRight size={22} color={theme.colors.primary} strokeWidth={2} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
        {hasAlerts ? (
          <TouchableOpacity
            onPress={() => {
              if (data.unreadCount > 0) router.push('/(producer)/notifications');
              else if (data.activeMissions.length > 0) router.push('/(producer)/missions');
              else router.push('/(producer)/batches');
            }}
            activeOpacity={0.75}
            style={{
              backgroundColor: theme.colors.primaryLight,
              borderRadius: theme.borderRadius.md,
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              marginBottom: theme.spacing.sm,
              borderWidth: 1,
              borderColor: theme.colors.border,
              minHeight: 0,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.primary, marginBottom: 4 }}>
              {t('producer.dashboard.farmer.alertsTitle')}
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.text.secondary, lineHeight: 18 }}>
              {alertLine}
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.primary, marginTop: 6, fontWeight: '600' }}>
              {t('producer.dashboard.farmer.alertsOpen')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}
