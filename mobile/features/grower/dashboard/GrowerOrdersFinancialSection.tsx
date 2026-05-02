import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { theme } from '../../../lib/theme';
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
      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '400',
            color: theme.colors.text.tertiary,
            letterSpacing: 1.2,
            marginBottom: theme.spacing.sm,
            textTransform: 'uppercase',
          }}
        >
          {t('producer.dashboard.financialOrders.title')}
        </Text>
        <View
          style={{
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '300', color: theme.colors.text.secondary, lineHeight: 20 }}>
            {t('producer.dashboard.financialOrders.platformAdminHint')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '400',
          color: theme.colors.text.tertiary,
          letterSpacing: 1.2,
          marginBottom: theme.spacing.sm,
          textTransform: 'uppercase',
        }}
      >
        {t('producer.dashboard.financialOrders.title')}
      </Text>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '300',
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.md,
          lineHeight: 18,
        }}
      >
        {t('producer.dashboard.financialOrders.subtitle')}
      </Text>
      <View style={{ gap: theme.spacing.sm }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.spacing.sm,
          }}
        >
          {[
            { label: t('producer.dashboard.financialOrders.shareTotal'), value: data.farmerOrderShareTotal, tone: 'primary' },
            { label: t('producer.dashboard.financialOrders.released'), value: data.farmerShareReleased, tone: 'emerald' },
            { label: t('producer.dashboard.financialOrders.inEscrow'), value: data.farmerShareInEscrow, tone: 'amber' },
            { label: t('producer.dashboard.financialOrders.pending'), value: data.farmerSharePending, tone: 'muted' },
          ].map((row) => (
            <View
              key={row.label}
              style={{
                flexGrow: 1,
                minWidth: '44%',
                backgroundColor: theme.colors.surfaceElevated,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.sm,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '400', color: theme.colors.text.secondary, marginBottom: 4 }}>
                {row.label}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '300',
                  color:
                    row.tone === 'emerald'
                      ? theme.colors.primary
                      : row.tone === 'amber'
                        ? theme.colors.warning
                        : theme.colors.text.primary,
                }}
              >
                {euro(row.value, locale)}
              </Text>
            </View>
          ))}
        </View>
        <View
          style={{
            backgroundColor: theme.colors.primaryLight,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '500', color: theme.colors.text.primary, marginBottom: 6 }}>
            {t('producer.dashboard.financialOrders.estimatedVeraBonus')}
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '300', color: theme.colors.primary }}>
            {euro(data.estimatedVeraBonusDeliveredLots, locale)}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginTop: theme.spacing.sm,
              lineHeight: 17,
            }}
          >
            {t('producer.dashboard.financialOrders.veraFootnote')}
          </Text>
        </View>
      </View>
    </View>
  );
}
