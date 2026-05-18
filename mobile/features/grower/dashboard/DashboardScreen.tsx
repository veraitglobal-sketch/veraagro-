import { View, ScrollView, RefreshControl, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../hooks/useAuth';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useDashboardData } from './useDashboardData';
import DashboardHeader from './DashboardHeader';
import NextStepCard from './NextStepCard';
import SyncQueueStrip from './SyncQueueStrip';
import { computeNextStep } from './computeNextStep';

/**
 * Home — single scroll, manual top inset only (iOS automatic scroll insets
 * below a fixed header caused a large empty band above cards).
 */
export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = useBioVeraScreenPadding();
  const data = useDashboardData(user);

  const farmName = data.estates[0]?.name || t('producer.dashboard.defaultFarmName');
  const estateCount = data.estates.length;
  const ps = data.parcelSteps;

  const hideDuplicateFieldLogCta = data.offlinePending > 0 && ps.loaded && computeNextStep({
    estateCount,
    totalParcels: ps.total,
    pendingApproval: ps.pending,
    approved: ps.approved,
    activeMissions: data.activeMissions.length,
    offlinePending: data.offlinePending,
    batchesReadyForTransport: data.batchesReadyForTransport,
  })?.kind === 'log_work';

  const showSyncStrip =
    data.offlinePending > 0 ||
    data.legacyFieldLogPending > 0 ||
    Boolean(data.offlineSyncLastError);

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

  const statusLine =
    ps.loaded && ps.total > 0
      ? ps.pending > 0
        ? t('producer.dashboard.homeStatusPending', {
            approved: ps.approved,
            total: ps.total,
            pending: ps.pending,
          })
        : t('producer.dashboard.homeStatus', { approved: ps.approved, total: ps.total })
      : ps.loaded && estateCount > 0
        ? t('producer.dashboard.homeStatusNoParcels')
        : null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Math.max(p.bottomInset, 12) + 8 },
      ]}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={data.refreshing}
          onRefresh={() => void data.onRefresh()}
          tintColor={enterpriseColors.primary}
          colors={[enterpriseColors.primary]}
        />
      }
    >
      <DashboardHeader
        farmName={farmName}
        partnerCode={user?.partnerCode}
        statusLine={statusLine}
        refreshing={data.refreshing}
        style={{ paddingTop: insets.top + 2 }}
      />

      <View
        style={[
          styles.main,
          { paddingLeft: p.screenPaddingLeft, paddingRight: p.screenPaddingRight },
        ]}
      >
        {showSyncStrip ? (
          <SyncQueueStrip
            pendingCount={data.offlinePending}
            legacyFieldLogCount={data.legacyFieldLogPending}
            syncing={data.offlineSyncing}
            lastError={data.offlineSyncLastError}
            onOpenFieldLog={() => router.push('/(producer)/(tabs)/field-log')}
            onSyncNow={() => void data.onRefresh()}
            onClearLocalQueue={data.onClearLocalQueue}
            onPurgeLegacyFieldLog={data.onPurgeLegacyFieldLog}
            hideOpenLogCta={hideDuplicateFieldLogCta}
            compact
          />
        ) : null}

        {ps.loaded ? (
          <NextStepCard
            ready
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
        ) : null}

        {hasAlerts ? (
          <TouchableOpacity
            onPress={() => {
              if (data.unreadCount > 0) router.push('/(producer)/notifications');
              else if (data.activeMissions.length > 0) router.push('/(producer)/missions');
              else router.push('/(producer)/batches');
            }}
            activeOpacity={0.75}
            style={styles.alertCard}
          >
            <Text style={styles.alertText} numberOfLines={2}>
              {alertLine}
            </Text>
            <Text style={styles.alertLink}>{t('producer.dashboard.farmer.alertsOpen')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: enterpriseColors.canvas,
  },
  scrollContent: {
    flexGrow: 0,
  },
  main: {
    gap: 8,
    paddingTop: 4,
  },
  alertCard: {
    backgroundColor: enterpriseColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    lineHeight: 18,
  },
  alertLink: {
    fontSize: 14,
    fontWeight: '600',
    color: enterpriseColors.primary,
    marginTop: 6,
  },
});
