import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  if (!financialData) return null;
  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Text style={{ fontSize: 12, fontWeight: '400', color: theme.colors.text.tertiary, letterSpacing: 1.2, marginBottom: theme.spacing.md, textTransform: 'uppercase' }}>
        {t('producer.financial.title')}
      </Text>
      <TouchableOpacity
        onPress={onViewWallet}
        activeOpacity={0.7}
        style={{
          backgroundColor: theme.colors.surfaceElevated,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 40, height: 40, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm }}>
              <Wallet size={20} color={theme.colors.primary} strokeWidth={1.5} />
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '500', color: theme.colors.text.primary, marginBottom: 2 }}>{t('producer.financial.totalEarned')}</Text>
              <Text style={{ fontSize: 11, fontWeight: '400', color: theme.colors.text.secondary }}>
                {t('producer.financial.available')}: {financialData.availableBalance.toLocaleString('en-US', { style: 'currency', currency: 'EUR' })}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '300', color: theme.colors.primary }}>
            {financialData.totalEarned.toLocaleString('en-US', { style: 'currency', currency: 'EUR' })}
          </Text>
        </View>
        {financialData.pendingBalance > 0 && (
          <View style={{ paddingTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '400', color: theme.colors.text.secondary }}>{t('producer.financial.pending')}</Text>
            <Text style={{ fontSize: 11, fontWeight: '300', color: theme.colors.warning }}>
              {financialData.pendingBalance.toLocaleString('en-US', { style: 'currency', currency: 'EUR' })}
            </Text>
          </View>
        )}
        {financialData.nextPayout && (
          <View style={{ paddingTop: theme.spacing.xs, flexDirection: 'row', alignItems: 'center' }}>
            <Calendar size={11} color={theme.colors.text.secondary} strokeWidth={1} />
            <Text style={{ fontSize: 11, fontWeight: '400', color: theme.colors.text.secondary, marginLeft: 4 }}>
              {t('producer.financial.nextPayout')}: {new Date(financialData.nextPayout).toLocaleDateString('en-US')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
