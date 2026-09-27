import { useState, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dsColors } from './theme';
import { useRouter } from 'expo-router';
import { BackButton } from './BackButton';

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
  const router = useRouter();
  const [active, setActive] = useState(initialKey ?? segments[0]?.key ?? '');

  if (segments.length === 0) return null;

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.head}>
        <View style={styles.headingRow}>
          <BackButton
            style={styles.back}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(producer)/(tabs)'))}
          />
          <View style={styles.headingCopy}>
            <Text style={styles.title} accessibilityRole="header">{title}</Text>
            {description ? <Text style={styles.description}>{description}</Text> : null}
          </View>
        </View>
        <View style={styles.segmentRow} accessibilityRole="tablist">
          {segments.map((seg) => {
            const on = seg.key === active;
            return (
              <TouchableOpacity
                key={seg.key}
                onPress={() => setActive(seg.key)}
                activeOpacity={0.7}
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
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 12 },
  back: { marginTop: 1 },
  headingCopy: { flex: 1, paddingTop: 5 },
  title: { fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: -0.45, color: dsColors.gray900 },
  description: { fontSize: 13, lineHeight: 18, color: dsColors.gray600, marginTop: 2 },
  segmentRow: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.06)',
  },
  segment: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 9,
  },
  segmentOn: {
    backgroundColor: dsColors.surface,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: dsColors.gray600,
    letterSpacing: -0.15,
  },
  segmentTextOn: {
    color: dsColors.gray900,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
});
