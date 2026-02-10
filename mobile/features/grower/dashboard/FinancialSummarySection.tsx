import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Wallet, Calendar } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import type { FinancialData } from './useDashboardData';

export default function FinancialSummarySection({
  financialData,
  onViewWallet,
}: {
  financialData: FinancialData | null;
  onViewWallet: () => void;
}) {
  if (!financialData) return null;
  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Text style={{ fontSize: 12, fontWeight: '300', color: theme.colors.text.primary, letterSpacing: 0.5, marginBottom: theme.spacing.md }}>
        Financial Summary
      </Text>
      <TouchableOpacity
        onPress={onViewWallet}
        activeOpacity={0.7}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.sm,
          borderWidth: 0.5,
          borderColor: 'rgba(0, 0, 0, 0.05)',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 40, height: 40, borderRadius: theme.borderRadius.sm, backgroundColor: `${theme.colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm }}>
              <Wallet size={20} color={theme.colors.primary} strokeWidth={1} />
            </View>
            <View>
              <Text style={{ fontSize: 11, fontWeight: '300', color: theme.colors.text.primary, marginBottom: 2 }}>Total Earned</Text>
              <Text style={{ fontSize: 9, fontWeight: '300', color: theme.colors.text.secondary }}>
                Available: {financialData.availableBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '300', color: theme.colors.primary }}>
            {financialData.totalEarned.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </Text>
        </View>
        {financialData.pendingBalance > 0 && (
          <View style={{ paddingTop: theme.spacing.sm, borderTopWidth: 0.5, borderTopColor: 'rgba(0, 0, 0, 0.05)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 9, fontWeight: '300', color: theme.colors.text.secondary }}>Pending</Text>
            <Text style={{ fontSize: 11, fontWeight: '300', color: theme.colors.warning }}>
              {financialData.pendingBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </Text>
          </View>
        )}
        {financialData.nextPayout && (
          <View style={{ paddingTop: theme.spacing.xs, flexDirection: 'row', alignItems: 'center' }}>
            <Calendar size={11} color={theme.colors.text.secondary} strokeWidth={1} />
            <Text style={{ fontSize: 9, fontWeight: '300', color: theme.colors.text.secondary, marginLeft: 4 }}>
              Next payout: {new Date(financialData.nextPayout).toLocaleDateString('en-US')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
