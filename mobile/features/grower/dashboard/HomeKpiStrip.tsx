import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { enterpriseUi } from '../../../lib/enterprise-ui';
import { growerSheet, growerSheetCardStyle } from '../../../design-system/grower-sheet-styles';
import type { OrdersFinancialSnapshot } from './fetchGrowerOrdersFinancial';
import { useAppLocaleTag } from '../../../lib/date-locale';

type ParcelStats = {
  loaded: boolean;
  total: number;
  pending: number;
  approved: number;
};

type Props = {
  loaded: boolean;
  estateCount: number;
  parcelSteps: ParcelStats;
  activeMissions: number;
  batchesReadyForTransport: number;
  activeBatches: number;
  offlinePending: number;
  ordersFinancial: OrdersFinancialSnapshot | null;
};

function chainCount(
  batchesReady: number,
  missions: number,
  batches: number,
): number {
  if (batchesReady > 0) return batchesReady;
  if (missions > 0) return missions;
  return batches;
}

function formatKpiMoney(n: number, locale: string): string {
  const amount = Math.round(n * 100) / 100;
  if (amount >= 1000) {
    const k = amount / 1000;
    return `${k.toLocaleString(locale, { maximumFractionDigits: 1 })}k\u00A0€`;
  }
  const decimals = Number.isInteger(amount) ? 0 : 2;
  return `${amount.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })}\u00A0€`;
}

function KpiCell({
  label,
  value,
  accent,
  bordered,
  compactValue,
}: {
  label: string;
  value: string;
  accent?: boolean;
  bordered?: boolean;
  compactValue?: boolean;
}) {
  return (
    <View style={[styles.cell, bordered && styles.cellBorder]}>
      <Text style={[enterpriseUi.kpiLabel, styles.kpiLabel]} numberOfLines={2}>
        {label}
      </Text>
      <Text
        style={[
          enterpriseUi.kpiValue,
          compactValue && styles.kpiValueCompact,
          accent && enterpriseUi.kpiValueAccent,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>
    </View>
  );
}

function KpiSkeleton() {
  return (
    <View style={styles.kpiWrap}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.cell, i < 2 && styles.cellBorder]}>
          <View style={styles.skelLabel} />
          <View style={styles.skelValue} />
        </View>
      ))}
    </View>
  );
}

/** At-a-glance farm numbers — sheet stat strip on home. */
export function HomeKpiStrip({
  loaded,
  estateCount,
  parcelSteps,
  activeMissions,
  batchesReadyForTransport,
  activeBatches,
  offlinePending,
  ordersFinancial,
}: Props) {
  const { t } = useTranslation();
  const locale = useAppLocaleTag();

  if (!loaded) return <KpiSkeleton />;
  if (estateCount === 0) return null;

  const chain = chainCount(batchesReadyForTransport, activeMissions, activeBatches);
  const escrow =
    ordersFinancial &&
    ordersFinancial.dashboardRole !== 'PLATFORM' &&
    ordersFinancial.farmerShareInEscrow > 0
      ? ordersFinancial.farmerShareInEscrow
      : 0;

  const parcelValue =
    parcelSteps.total > 0 ? `${parcelSteps.approved}/${parcelSteps.total}` : '—';
  const parcelAccent = parcelSteps.approved > 0 && parcelSteps.pending === 0;
  const chainAccent = chain > 0;
  const outboxAccent = offlinePending > 0;

  const thirdLabel = escrow > 0 ? t('producer.dashboard.homeKpi.escrow') : t('producer.dashboard.homeKpi.outbox');
  const thirdValue =
    escrow > 0 ? formatKpiMoney(escrow, locale) : offlinePending > 0 ? String(offlinePending) : '0';

  return (
    <View style={styles.kpiWrap}>
      <KpiCell
        label={t('producer.dashboard.homeKpi.parcels')}
        value={parcelValue}
        accent={parcelAccent}
        bordered
      />
      <KpiCell
        label={t('producer.dashboard.homeKpi.chain')}
        value={String(chain)}
        accent={chainAccent}
        bordered
      />
      <KpiCell
        label={thirdLabel}
        value={thirdValue}
        accent={outboxAccent || escrow > 0}
        compactValue={escrow > 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  kpiWrap: {
    ...growerSheetCardStyle({ marginBottom: 18 }),
    flexDirection: 'row',
    paddingVertical: 22,
    paddingHorizontal: 10,
    minHeight: 100,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    minHeight: 68,
  },
  kpiLabel: {
    textAlign: 'center',
    width: '100%',
  },
  kpiValueCompact: {
    fontSize: 22,
    letterSpacing: -0.4,
    width: '100%',
    textAlign: 'center',
  },
  cellBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(45, 90, 39, 0.1)',
  },
  skelLabel: {
    width: 52,
    height: 10,
    borderRadius: 4,
    backgroundColor: growerSheet.cardTint,
    marginBottom: 12,
  },
  skelValue: {
    width: 40,
    height: 22,
    borderRadius: 6,
    backgroundColor: growerSheet.cardTint,
  },
});
