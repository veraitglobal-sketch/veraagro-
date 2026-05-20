import React from 'react';
import { View, Text } from 'react-native';
import { growerStyles, growerUi } from '../../../lib/grower-ui';
import { AnimatedCountText } from '../../../components/grower/AnimatedCountText';

export type HubMetricRow =
  | { key: string; label: string; type: 'count'; count: number; animate?: boolean }
  | { key: string; label: string; type: 'ratio'; approved: number; total: number; animate?: boolean }
  | { key: string; label: string; type: 'text'; value: string };

function MetricValue({ row }: { row: HubMetricRow }) {
  if (row.type === 'text') {
    return <Text style={growerStyles.metricValue}>{row.value}</Text>;
  }

  if (row.type === 'count') {
    return (
      <AnimatedCountText value={row.count} style={growerStyles.metricValue} />
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <AnimatedCountText value={row.approved} style={growerStyles.metricValue} />
      <Text style={growerStyles.metricValue}>/</Text>
      <AnimatedCountText value={row.total} style={growerStyles.metricValue} />
    </View>
  );
}

export function HubSummaryMetrics({ title, rows }: { title: string; rows: HubMetricRow[] }) {
  if (rows.length === 0) return null;

  return (
    <View style={growerUi.formPanel}>
      <Text style={growerStyles.metricsTitle}>{title}</Text>
      {rows.map((r) => (
        <View key={r.key} style={growerStyles.metricRow}>
          <Text style={growerStyles.metricLabel}>{r.label}</Text>
          <MetricValue row={r} />
        </View>
      ))}
    </View>
  );
}
