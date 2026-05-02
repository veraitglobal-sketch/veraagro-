import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Wallet } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useAppLocaleTag } from '../../../lib/date-locale';
import type { OrdersFinancialSnapshot } from './fetchGrowerOrdersFinancial';

function euro(n: number, locale: string) {
  return n.toLocaleString(locale, { style: 'currency', currency: 'EUR' });
}

/**
 * Compact “open Wallet” row for producer home — full grid stays on Wallet screen.
 */
export default function DashboardHomeFinanceTeaser({
  data,
  onPress,
}: {
  data: OrdersFinancialSnapshot | null;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const locale = useAppLocaleTag();

  const line =
    data && data.dashboardRole !== 'PLATFORM'
      ? `${euro(data.farmerOrderShareTotal, locale)} · ${t('producer.dashboard.financialOrders.inEscrow')}: ${euro(data.farmerShareInEscrow, locale)}`
      : t('producer.dashboard.homeFinanceTeaserHint');

  return (
    <TouchableOpacity
      onPress={onPress}
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
        minHeight: 56,
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
        <Wallet size={22} color={theme.colors.primary} strokeWidth={1.75} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 2 }}>
          {t('producer.dashboard.homeFinanceTeaserTitle')}
        </Text>
        <Text style={{ fontSize: 12, color: theme.colors.text.secondary, lineHeight: 16 }} numberOfLines={2}>
          {line}
        </Text>
      </View>
      <ChevronRight size={20} color={theme.colors.primary} strokeWidth={2} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}
