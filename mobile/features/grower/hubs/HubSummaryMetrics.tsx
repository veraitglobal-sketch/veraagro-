import React from 'react';
import { View, Text } from 'react-native';
import { theme } from '../../../lib/theme';

export type HubMetricRow = { key: string; label: string; value: string };

/**
 * Compact snapshot above hub sections (counts from `useDashboardData`).
 */
export function HubSummaryMetrics({
  title,
  rows,
}: {
  title: string;
  rows: HubMetricRow[];
}) {
  if (rows.length === 0) return null;

  return (
    <View
      style={{
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginBottom: theme.spacing.md,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: theme.colors.text.tertiary,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          marginBottom: theme.spacing.xs,
        }}
      >
        {title}
      </Text>
      {rows.map((r) => (
        <View
          key={r.key}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 6,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 14, color: theme.colors.text.secondary, flex: 1 }}>{r.label}</Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: theme.colors.text.primary,
              fontVariant: ['tabular-nums'],
            }}
          >
            {r.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
