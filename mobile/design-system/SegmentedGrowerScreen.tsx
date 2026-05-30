import { useState, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dsColors } from './theme';
import { EnterprisePageTitle } from './EnterprisePageTitle';

export type SegmentDef = {
  key: string;
  label: string;
};

type Props = {
  title: string;
  description?: string;
  segments: SegmentDef[];
  initialKey?: string;
  renderSegment: (key: string) => ReactNode;
};

/** Tabbed grower stack — segment control + one active panel (flex 1). */
export function SegmentedGrowerScreen({
  title,
  description,
  segments,
  initialKey,
  renderSegment,
}: Props) {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState(initialKey ?? segments[0]?.key ?? '');

  if (segments.length === 0) return null;

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.head}>
        <EnterprisePageTitle title={title} description={description} style={styles.title} />
        <View style={styles.segmentRow} accessibilityRole="tablist">
          {segments.map((seg) => {
            const on = seg.key === active;
            return (
              <TouchableOpacity
                key={seg.key}
                onPress={() => setActive(seg.key)}
                activeOpacity={0.82}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={[styles.segment, on && styles.segmentOn]}
              >
                <Text style={[styles.segmentText, on && styles.segmentTextOn]} numberOfLines={1}>
                  {seg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View style={styles.body}>{renderSegment(active)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: dsColors.canvas,
  },
  head: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    marginBottom: 10,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dsColors.borderNeutral,
    backgroundColor: dsColors.surface,
  },
  segmentOn: {
    borderColor: dsColors.primary,
    backgroundColor: dsColors.primaryTint,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: dsColors.muted,
    letterSpacing: -0.1,
  },
  segmentTextOn: {
    color: dsColors.primary,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
});
