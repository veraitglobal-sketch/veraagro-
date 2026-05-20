import { View, Text, StyleSheet, type TextStyle } from 'react-native';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { AnimatedCountText } from '../../../components/grower/AnimatedCountText';
import type { HubMetricRow } from './HubSummaryMetrics';

function valueStyle(row: HubMetricRow): TextStyle {
  if (row.type === 'count') {
    return row.count > 0 ? enterpriseUi.kpiValueAccent : enterpriseUi.kpiValue;
  }
  if (row.type === 'ratio') {
    return row.total > 0 ? enterpriseUi.kpiValueAccent : enterpriseUi.kpiValue;
  }
  return enterpriseUi.kpiValue;
}

function StripValue({ row }: { row: HubMetricRow }) {
  if (row.type === 'text') {
    return (
      <Text style={enterpriseUi.kpiValue} numberOfLines={1}>
        {row.value}
      </Text>
    );
  }
  if (row.type === 'count') {
    return (
      <AnimatedCountText value={row.count} style={valueStyle(row)} />
    );
  }
  const approvedStyle =
    row.approved > 0 ? enterpriseUi.kpiValueAccent : enterpriseUi.kpiValue;

  return (
    <View style={styles.ratioRow}>
      <AnimatedCountText value={row.approved} style={approvedStyle} />
      <Text style={[enterpriseUi.kpiValue, styles.ratioSlash]}>/</Text>
      <AnimatedCountText value={row.total} style={enterpriseUi.kpiValue} />
    </View>
  );
}

/** KPI strip — elevated white on canvas; accent numerals when data exists. */
export function HubMetricsStrip({ rows }: { rows: HubMetricRow[] }) {
  if (rows.length === 0) return null;
  const slice = rows.slice(0, 3);

  return (
    <View style={[enterpriseUi.inAppPanel, styles.strip]}>
      {slice.map((row, index) => (
        <View
          key={row.key}
          style={[styles.cell, index < slice.length - 1 && styles.cellBorder]}
        >
          <Text style={[enterpriseUi.kpiLabel, styles.labelCenter]} numberOfLines={2}>
            {row.label}
          </Text>
          <StripValue row={row} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    paddingVertical: 22,
    paddingHorizontal: 12,
    marginBottom: 18,
    minHeight: 100,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    minHeight: 72,
  },
  cellBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: enterpriseColors.gray200,
  },
  labelCenter: {
    textAlign: 'center',
  },
  ratioRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ratioSlash: {
    color: enterpriseColors.gray600,
  },
});
