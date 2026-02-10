import React from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { useSocket } from '../../../hooks/useSocket';
import TrustScoreWidget from '../../../components/TrustScoreWidget';
import { theme } from '../../../lib/theme';
import { useDashboardData } from './useDashboardData';
import DashboardHeader from './DashboardHeader';
import QuickActionsSection from './QuickActionsSection';
import LiveInformationSection from './LiveInformationSection';
import FinancialSummarySection from './FinancialSummarySection';
import RecentActivitySection from './RecentActivitySection';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { connected } = useSocket();
  const data = useDashboardData(user);

  const farmName = data.estates[0]?.name || 'My Farm';

  const handlers = {
    onMojiProizvodi: () => router.push('/(producer)/(tabs)/products'),
    onKalkulatorTroskova: () => router.push('/(producer)/(tabs)/cost-calculator'),
    onSertifikati: () => router.push('/(producer)/(tabs)/certifications'),
    onZabranjenaSredstva: () => router.push('/(producer)/(tabs)/banned-substances'),
    onScanInput: () => router.push({ pathname: '/(producer)/scanner', params: { returnTo: 'products' } }),
    onNewEntry: () => router.push('/(producer)/(tabs)/field-log'),
    onReportHarvest: () => router.push('/(producer)/(tabs)/harvest'),
    onVeraInsights: () => router.push('/(producer)/vera-insights'),
    onViewMissions: () => router.push('/(producer)/missions'),
    onViewBatches: () => router.push('/(producer)/batches'),
    onViewNotifications: () => router.push('/(producer)/notifications'),
    onViewWallet: () => router.push('/(producer)/(tabs)/wallet'),
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
        connected={connected}
      />
      <View style={{ padding: theme.spacing.md }}>
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.05)',
            alignItems: 'center',
          }}
        >
          <TrustScoreWidget score={data.trustScore} size={140} />
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
