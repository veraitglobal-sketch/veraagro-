import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../hooks/useAuth';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useGrowerDashboard } from '../../../contexts/GrowerDashboardContext';
import DashboardHeader from './DashboardHeader';
import NextStepCard from './NextStepCard';
import SyncQueueStrip from './SyncQueueStrip';
import DashboardHomeMore from './DashboardHomeMore';
import { computeNextStep } from './computeNextStep';

/**
 * Mobile home — next step, sync, wallet/season/education, alerts.
 * Tab screens (Field / Lots / Supplies) keep their own tools.
 */
export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = useBioVeraScreenPadding();
  const data = useGrowerDashboard();

  const farmName = data.estates[0]?.name || t('producer.dashboard.defaultFarmName');
  const estateCount = data.estates.length;
  const ps = data.parcelSteps;

  const nextStep =
    ps.loaded
      ? computeNextStep({
          estateCount,
          totalParcels: ps.total,
          pendingApproval: ps.pending,
          approved: ps.approved,
          activeMissions: data.activeMissions.length,
          offlinePending: data.offlinePending,
          batchesReadyForTransport: data.batchesReadyForTransport,
        })
      : null;

  const hideDuplicateFieldLogCta = data.offlinePending > 0 && nextStep?.kind === 'log_work';

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
    <EnterpriseScreen
      withTopWash
      refreshing={data.refreshing}
      onRefresh={() => void data.onRefresh()}
      contentPaddingBottom={Math.max(p.bottomInset, 16) + 16}
      header={
        <DashboardHeader
          farmName={farmName}
          partnerCode={user?.partnerCode}
          statusLine={statusLine}
          reserveStatusLine={!ps.loaded}
          refreshing={data.refreshing}
          style={{ paddingTop: insets.top + 6 }}
        />
      }
    >
      <View style={styles.body}>
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
          onAddParcel={() => router.push('/(producer)/(tabs)/field')}
          onMissions={() => router.push('/(producer)/missions')}
          onRequestTransport={() => router.push('/(producer)/missions-create')}
          onSteps={() => router.push('/(producer)/(tabs)/steps')}
          onFieldLog={() => router.push('/(producer)/(tabs)/field-log')}
        />

        <DashboardHomeMore ordersFinancial={data.ordersFinancial} />

        {hasAlerts ? (
          <TouchableOpacity
            onPress={() => {
              if (data.unreadCount > 0) router.push('/(producer)/notifications');
              else if (data.activeMissions.length > 0) router.push('/(producer)/missions');
              else router.push('/(producer)/batches');
            }}
            activeOpacity={0.88}
            style={styles.alertCard}
            accessibilityRole="button"
          >
            <Text style={styles.alertTitle}>{t('producer.dashboard.farmer.alertsTitle')}</Text>
            <Text style={styles.alertText} numberOfLines={2}>
              {alertLine}
            </Text>
            <Text style={styles.alertLink}>{t('producer.dashboard.farmer.alertsOpen')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </EnterpriseScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  alertCard: {
    backgroundColor: enterpriseColors.primaryTint,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(45, 90, 39, 0.18)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.primary,
    marginBottom: 4,
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
    marginTop: 8,
  },
});
