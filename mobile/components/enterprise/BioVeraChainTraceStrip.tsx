import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';

type StepKey = 'parcel' | 'pack' | 'transport' | 'shelf';

type StepState = 'done' | 'current' | 'upcoming';

type Props = {
  parcelCount: number;
  lotCount: number;
  lotsReady: number;
  activeMissions: number;
  hasTransportRecord: boolean;
};

const STEP_KEYS: StepKey[] = ['parcel', 'pack', 'transport', 'shelf'];

function resolveStates(props: Props): StepState[] {
  const reached = [
    props.parcelCount > 0,
    props.lotCount > 0,
    props.lotsReady > 0 || props.activeMissions > 0,
    props.hasTransportRecord,
  ];
  const currentIndex = reached.findIndex((r) => !r);
  if (currentIndex === -1) {
    return reached.map(() => 'done' as StepState);
  }
  return reached.map((_, index) => {
    if (index < currentIndex) return 'done';
    if (index === currentIndex) return 'current';
    return 'upcoming';
  });
}

function railProgress(states: StepState[]): number {
  const currentIdx = states.findIndex((s) => s === 'current');
  const lastDone = states.lastIndexOf('done');
  if (lastDone === states.length - 1) return 1;
  if (currentIdx >= 0) return (currentIdx + 0.5) / (states.length - 1);
  if (lastDone >= 0) return (lastDone + 1) / (states.length - 1);
  return 0;
}

function labelStyle(state: StepState) {
  switch (state) {
    case 'current':
      return styles.labelCurrent;
    case 'done':
      return styles.labelDone;
    default:
      return styles.labelUpcoming;
  }
}

/**
 * Chain tab — typographic enterprise cue (no cards, dots, or step widgets).
 */
export function BioVeraChainTraceStrip({
  compact = false,
  ...props
}: Props & { compact?: boolean }) {
  const { t } = useTranslation();
  const states = resolveStates(props);
  const progress = railProgress(states);

  const labels: Record<StepKey, string> = {
    parcel: t('producer.brand.chainTrace.stepParcel'),
    pack: t('producer.brand.chainTrace.stepPack'),
    transport: t('producer.brand.chainTrace.stepTransport'),
    shelf: t('producer.brand.chainTrace.stepShelf'),
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]} accessibilityRole="summary">
      {compact ? null : (
        <>
          <Text style={styles.title}>{t('producer.brand.chainTrace.title')}</Text>
          <Text style={styles.lead}>{t('producer.brand.chainTrace.lead')}</Text>
        </>
      )}

      <View style={styles.chainRow}>
        {STEP_KEYS.map((key, index) => {
          const state = states[index];
          const isLast = index === STEP_KEYS.length - 1;
          return (
            <View key={key} style={styles.chainSegment}>
              <Text style={[styles.label, labelStyle(state)]} numberOfLines={1}>
                {labels[key]}
              </Text>
              {!isLast ? <Text style={styles.separator}>/</Text> : null}
            </View>
          );
        })}
      </View>

      <View style={styles.meter} accessibilityElementsHidden>
        <View style={[styles.meterFill, { flex: Math.max(0.04, progress) }]} />
        <View style={{ flex: Math.max(0.04, 1 - progress) }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginBottom: 22,
  },
  wrapCompact: {
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  },
  title: {
    ...enterpriseUi.inAppTitle,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  lead: {
    ...enterpriseUi.inAppLead,
    marginTop: 6,
    marginBottom: 18,
  },
  chainRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    rowGap: 6,
  },
  chainSegment: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexShrink: 1,
    maxWidth: '100%',
  },
  label: {
    fontSize: 15,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    letterSpacing: -0.2,
  },
  labelDone: {
    fontWeight: '400',
    color: enterpriseColors.gray900,
  },
  labelCurrent: {
    fontSize: 16,
    fontWeight: '500',
    color: enterpriseColors.primary,
    letterSpacing: -0.28,
  },
  labelUpcoming: {
    fontWeight: '400',
    color: enterpriseColors.gray600,
  },
  separator: {
    fontSize: 15,
    fontWeight: '400',
    color: enterpriseColors.gray200,
    marginHorizontal: 10,
    letterSpacing: 0,
  },
  meter: {
    flexDirection: 'row',
    height: StyleSheet.hairlineWidth,
    marginTop: 16,
    backgroundColor: enterpriseColors.gray200,
  },
  meterFill: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: enterpriseColors.primary,
  },
});
