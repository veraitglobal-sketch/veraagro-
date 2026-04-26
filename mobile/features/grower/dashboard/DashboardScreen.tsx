import React from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import TrustScoreWidget from '../../../components/TrustScoreWidget';
import { theme } from '../../../lib/theme';
import { useDashboardData } from './useDashboardData';
import DashboardHeader from './DashboardHeader';
import NextStepCard from './NextStepCard';
import QuickActionsSection from './QuickActionsSection';
import LiveInformationSection from './LiveInformationSection';
import FinancialSummarySection from './FinancialSummarySection';
import RecentActivitySection from './RecentActivitySection';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const data = useDashboardData(user);

  const farmName = data.estates[0]?.name || 'My Farm';

  const estateCount = data.estates.length;
  const ps = data.parcelSteps;

  const handlers = {
    onMyProducts: () => router.push('/(producer)/(tabs)/products'),
    onCostCalculator: () => router.push('/(producer)/(tabs)/cost-calculator'),
    onCertifications: () => router.push('/(producer)/(tabs)/certifications'),
    onBannedSubstances: () => router.push('/(producer)/(tabs)/banned-substances'),
    onScanInput: () => router.push({ pathname: '/(producer)/scanner', params: { returnTo: 'products' } }),
    onNewEntry: () => router.push('/(producer)/(tabs)/field-log'),
    onReportHarvest: () => router.push('/(producer)/(tabs)/harvest'),
    onVeraInsights: () => router.push('/(producer)/vera-insights'),
    onViewMissions: () => router.push('/(producer)/missions'),
    onViewBatches: () => router.push('/(producer)/batches'),
    onViewNotifications: () => router.push('/(producer)/notifications'),
    onViewWallet: () => router.push('/(producer)/(tabs)/wallet'),
    onEstates: () => router.push('/(producer)/estates'),
    onFieldSeason: () => router.push('/(producer)/field-season'),
  };

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
      <View style={{ padding: theme.spacing.md }}>
        <NextStepCard
          ready={ps.loaded}
          estateCount={estateCount}
          totalParcels={ps.total}
          pendingApproval={ps.pending}
          approved={ps.approved}
          activeMissions={data.activeMissions.length}
          offlinePending={data.offlinePending}
          onAddField={() => router.push('/(producer)/estates/new')}
          onAddParcel={() => router.push('/(producer)/estates')}
          onMissions={handlers.onViewMissions}
          onSteps={handlers.onFieldSeason}
          onFieldLog={handlers.onNewEntry}
        />
        <View
          style={{
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: 'center',
          }}
        >
          <TrustScoreWidget score={data.trustScore} size={100} />
        </View>
        <QuickActionsSection handlers={handlers} />
        <LiveInformationSection
          activeMissionsCount={data.activeMissions.length}
          activeBatchesCount={data.activeBatches.length}
          unreadCount={data.unreadCount}
          onMissions={handlers.onViewMissions}
          onBatches={handlers.onViewBatches}
          onNotifications={handlers.onViewNotifications}
        />
        <FinancialSummarySection financialData={data.financialData} onViewWallet={handlers.onViewWallet} />
        <RecentActivitySection entries={data.recentEntries} />
      </View>
    </ScrollView>
  );
}
