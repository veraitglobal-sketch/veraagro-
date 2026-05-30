import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppLocaleTag } from '../../../lib/date-locale';
import {
  enterpriseColors,
  enterpriseUi,
  enterpriseValueColor,
  type EnterpriseValueTone,
} from '../../../lib/enterprise-ui';
import type { OrdersFinancialSnapshot } from './fetchGrowerOrdersFinancial';

function euro(n: number, locale: string) {
  return n.toLocaleString(locale, { style: 'currency', currency: 'EUR' });
}

export default function GrowerOrdersFinancialSection({
  data,
}: {
  data: OrdersFinancialSnapshot | null;
}) {
  const { t } = useTranslation();
  const locale = useAppLocaleTag();
  if (!data) return null;

  if (data.dashboardRole === 'PLATFORM') {
    return (
      <View style={styles.block}>
        <Text style={enterpriseUi.inAppSectionLabel}>{t('producer.dashboard.financialOrders.title')}</Text>
        <View style={styles.panel}>
          <Text style={styles.hint}>{t('producer.dashboard.financialOrders.platformAdminHint')}</Text>
        </View>
      </View>
    );
  }

  const rows: { label: string; value: number; tone: EnterpriseValueTone }[] = [
    { label: t('producer.dashboard.financialOrders.shareTotal'), value: data.farmerOrderShareTotal, tone: 'default' },
    { label: t('producer.dashboard.financialOrders.released'), value: data.farmerShareReleased, tone: 'primary' },
    { label: t('producer.dashboard.financialOrders.inEscrow'), value: data.farmerShareInEscrow, tone: 'pending' },
    { label: t('producer.dashboard.financialOrders.pending'), value: data.farmerSharePending, tone: 'muted' },
  ];

  return (
    <View style={styles.block}>
      <Text style={enterpriseUi.inAppSectionLabel}>{t('producer.dashboard.financialOrders.title')}</Text>
      <Text style={styles.subtitle}>{t('producer.dashboard.financialOrders.subtitle')}</Text>
      <View style={styles.grid}>
        {rows.map((row) => (
          <View key={row.label} style={styles.metric}>
            <Text style={styles.metricLabel}>{row.label}</Text>
            <Text style={[enterpriseUi.kpiValue, { fontSize: 18, color: enterpriseValueColor(row.tone) }]}>
              {euro(row.value, locale)}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.bonusPanel}>
        <Text style={styles.bonusTitle}>{t('producer.dashboard.financialOrders.estimatedVeraBonus')}</Text>
        <Text style={[enterpriseUi.kpiValue, { fontSize: 20, color: enterpriseColors.primary }]}>
          {euro(data.estimatedVeraBonusDeliveredLots, locale)}
        </Text>
        <Text style={styles.bonusFoot}>{t('producer.dashboard.financialOrders.veraFootnote')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 20,
  },
  subtitle: {
    ...enterpriseUi.premiumSub,
    marginBottom: 14,
    marginTop: -4,
  },
  panel: {
    ...enterpriseUi.inAppPanel,
    padding: 16,
  },
  hint: {
    fontSize: 14,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  metric: {
    flexGrow: 1,
    minWidth: '44%',
    backgroundColor: enterpriseColors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    marginBottom: 6,
  },
  bonusPanel: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: enterpriseColors.premiumTintBorder,
    backgroundColor: enterpriseColors.premiumTintBg,
  },
  bonusTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: enterpriseColors.gray900,
    marginBottom: 8,
  },
  bonusFoot: {
    fontSize: 14,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 10,
    lineHeight: 17,
  },
});
