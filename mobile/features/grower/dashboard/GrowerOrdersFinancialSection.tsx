import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react-native';
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
      <View style={styles.panel}>
        <View style={styles.grid}>
          {rows.map((row, i) => (
            <View
              key={row.label}
              style={[styles.metric, i % 2 === 0 && styles.metricLeft, i < 2 && styles.metricTop]}
            >
              <Text style={styles.metricLabel} numberOfLines={1}>
                {row.label}
              </Text>
              <Text
                style={[styles.metricValue, { color: enterpriseValueColor(row.tone) }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {euro(row.value, locale)}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.bonusRow}>
          <View style={styles.bonusIcon}>
            <Sparkles size={16} color={enterpriseColors.primary} strokeWidth={1.9} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.bonusTitle}>{t('producer.dashboard.financialOrders.estimatedVeraBonus')}</Text>
            <Text style={styles.bonusFoot}>{t('producer.dashboard.financialOrders.veraFootnote')}</Text>
          </View>
          <Text style={styles.bonusValue}>{euro(data.estimatedVeraBonusDeliveredLots, locale)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 12.5,
    color: enterpriseColors.gray600,
    lineHeight: 17,
    marginBottom: 10,
    marginTop: -2,
    marginLeft: 4,
  },
  panel: {
    ...enterpriseUi.inAppPanel,
  },
  hint: {
    fontSize: 13,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    lineHeight: 19,
    padding: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metric: {
    width: '50%',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  metricLeft: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: enterpriseColors.gray200,
  },
  metricTop: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  bonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
    backgroundColor: 'rgba(45, 90, 39, 0.04)',
  },
  bonusIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E8F1E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: enterpriseColors.gray900,
  },
  bonusFoot: {
    fontSize: 11.5,
    color: enterpriseColors.gray600,
    marginTop: 1,
    lineHeight: 15,
  },
  bonusValue: {
    fontSize: 16,
    fontWeight: '700',
    color: enterpriseColors.primary,
    fontVariant: ['tabular-nums'],
  },
});
