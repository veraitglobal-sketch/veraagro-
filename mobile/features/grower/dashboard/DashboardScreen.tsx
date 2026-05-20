import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { TabRootBody } from '../../../components/enterprise/TabRootBody';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useAuth } from '../../../hooks/useAuth';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useGrowerDashboard } from '../../../contexts/GrowerDashboardContext';
import { useGrowerTabRefresh } from '../../../hooks/useGrowerTabRefresh';
import { BioVeraProvenanceRibbon } from '../../../components/enterprise/BioVeraProvenanceRibbon';
import NextStepCard from './NextStepCard';
import { HomeFarmSnapshot } from './HomeFarmSnapshot';
import { HomeDashboardHeader } from './HomeDashboardHeader';
import { HomeKpiStrip } from './HomeKpiStrip';
import { tString } from '../../../lib/i18n-strings';

function humanizeSyncError(lastError: string | null, pendingCount: number, t: TFunction): string | null {
  if (!lastError) return null;
  const trimmed = lastError.trim();
  if (trimmed === 'producer.sync.itemsNotSent' || /^producer\.sync\.itemsNotSent\b/.test(trimmed)) {
    return tString(t, 'producer.sync.itemsNotSent', { count: Math.max(1, pendingCount) });
  }
  return trimmed;
}

/**
 * Home — one screen, one priority. No hub nav, metrics, or alert stacks here.
 * @see mobile/docs/MOBILE_SCROLL_BUDGET.md
 */
export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const data = useGrowerDashboard();
  const tabRefresh = useGrowerTabRefresh();

  const farmName = data.estates[0]?.name || t('producer.dashboard.defaultFarmName');
  const estateCount = data.estates.length;
  const ps = data.parcelSteps;

  const greeting = user?.firstName
    ? t('producer.dashboard.greetingName', { name: user.firstName })
    : t('producer.dashboard.greeting');

  const syncError = humanizeSyncError(data.offlineSyncLastError, data.offlinePending, t);

  return (
    <EnterpriseScreen
      fillViewport
      withTopWash
      refreshing={tabRefresh.refreshing}
      onRefresh={() => void tabRefresh.onRefresh()}
      contentPaddingBottom={Math.max(p.bottomInset, 16) + 16}
      header={
        <HomeDashboardHeader
          farmName={farmName}
          greetingLine={greeting}
          partnerCode={user?.partnerCode}
          parcelSteps={ps}
          estateCount={estateCount}
        />
      }
    >
      <TabRootBody style={{ paddingTop: 0 }}>
        <HomeKpiStrip
          loaded={ps.loaded}
          estateCount={estateCount}
          parcelSteps={ps}
          activeMissions={data.activeMissions.length}
          batchesReadyForTransport={data.batchesReadyForTransport}
          activeBatches={data.activeBatches.length}
          offlinePending={data.offlinePending}
          ordersFinancial={data.ordersFinancial}
        />

        <NextStepCard
          ready={ps.loaded}
          estateCount={estateCount}
          totalParcels={ps.total}
          pendingApproval={ps.pending}
          approved={ps.approved}
          activeMissions={data.activeMissions.length}
          offlinePending={data.offlinePending}
          legacyFieldLogPending={data.legacyFieldLogPending}
          unreadNotifications={data.unreadCount}
          batchesReadyForTransport={data.batchesReadyForTransport}
          syncError={syncError}
          syncing={data.offlineSyncing}
          onAddField={() => router.push('/(producer)/estates/new')}
          onAddParcel={() => router.push('/(producer)/(tabs)/field')}
          onMissions={() => router.push('/(producer)/missions')}
          onRequestTransport={() => router.push('/(producer)/missions-create')}
          onSteps={() => router.push('/(producer)/(tabs)/steps')}
          onFieldLog={() => router.push('/(producer)/(tabs)/field-log')}
          onSyncNow={() => void data.onRefresh()}
          onNotifications={() => router.push('/(producer)/notifications')}
        />

        <BioVeraProvenanceRibbon compact />

        <HomeFarmSnapshot
          estateCount={estateCount}
          parcelSteps={ps}
          activeMissions={data.activeMissions.length}
          batchesReadyForTransport={data.batchesReadyForTransport}
          activeBatches={data.activeBatches.length}
          offlinePending={data.offlinePending}
          ordersFinancial={data.ordersFinancial}
        />
      </TabRootBody>
    </EnterpriseScreen>
  );
}
