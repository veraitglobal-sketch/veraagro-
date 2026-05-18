import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react-native';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { homeUi } from '../../../lib/home-ui';
import { computeNextStep, type NextStep } from './computeNextStep';

export interface NextStepCardProps {
  estateCount: number;
  totalParcels: number;
  pendingApproval: number;
  approved: number;
  activeMissions: number;
  offlinePending: number;
  batchesReadyForTransport: number;
  ready: boolean;
  onAddField: () => void;
  onAddParcel: () => void;
  onMissions: () => void;
  onRequestTransport: () => void;
  onSteps: () => void;
  onFieldLog: () => void;
}

function labelAndCta(
  t: (k: string, o?: Record<string, string | number>) => string,
  step: NextStep,
  props: NextStepCardProps
): { title: string; body: string; cta: string; onPress: () => void } {
  switch (step.kind) {
    case 'add_field':
      return {
        title: t('producer.dashboard.nextStep.addFieldTitle'),
        body: t('producer.dashboard.nextStep.addFieldBody'),
        cta: t('producer.dashboard.nextStep.addFieldCta'),
        onPress: props.onAddField,
      };
    case 'add_parcel':
      return {
        title: t('producer.dashboard.nextStep.addParcelTitle'),
        body: t('producer.dashboard.nextStep.addParcelBody'),
        cta: t('producer.dashboard.nextStep.addParcelCta'),
        onPress: props.onAddParcel,
      };
    case 'missions':
      return {
        title: t('producer.dashboard.nextStep.missionsTitle'),
        body: t('producer.dashboard.nextStep.missionsBody'),
        cta: t('producer.dashboard.nextStep.missionsCta'),
        onPress: props.onMissions,
      };
    case 'request_transport':
      return {
        title: t('producer.dashboard.nextStep.requestTransportTitle'),
        body: t('producer.dashboard.nextStep.requestTransportBody'),
        cta: t('producer.dashboard.nextStep.requestTransportCta'),
        onPress: props.onRequestTransport,
      };
    case 'pending_approval':
      return {
        title: t('producer.dashboard.nextStep.pendingTitle', { count: step.pendingCount ?? 0 }),
        body: t('producer.dashboard.nextStep.pendingBody'),
        cta: t('producer.dashboard.nextStep.pendingCta'),
        onPress: props.onSteps,
      };
    case 'log_work':
      return {
        title: t('producer.dashboard.nextStep.logWorkTitle'),
        body: t('producer.dashboard.nextStep.logWorkBody'),
        cta: t('producer.dashboard.nextStep.logWorkCta'),
        onPress: props.onFieldLog,
      };
    case 'default_steps':
    default:
      return {
        title: t('producer.dashboard.nextStep.defaultTitle'),
        body: t('producer.dashboard.nextStep.defaultBody'),
        cta: t('producer.dashboard.nextStep.defaultCta'),
        onPress: props.onSteps,
      };
  }
}

export default function NextStepCard(props: NextStepCardProps) {
  const { t } = useTranslation();
  if (!props.ready) return null;

  const step = computeNextStep({
    estateCount: props.estateCount,
    totalParcels: props.totalParcels,
    pendingApproval: props.pendingApproval,
    approved: props.approved,
    activeMissions: props.activeMissions,
    offlinePending: props.offlinePending,
    batchesReadyForTransport: props.batchesReadyForTransport,
  });
  if (!step) return null;

  const { title, body, cta, onPress } = labelAndCta(t, step, props);

  return (
    <View style={homeUi.card}>
      <View style={homeUi.cardAccent} />
      <View style={styles.body}>
        <Text style={styles.eyebrow}>{t('producer.dashboard.nextStep.eyebrow')}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{body}</Text>
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={homeUi.primaryCta} accessibilityRole="button">
          <Text style={homeUi.primaryCtaText}>{cta}</Text>
          <ChevronRight size={18} color={enterpriseColors.white} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: enterpriseColors.gray600,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.25,
    marginBottom: 4,
  },
  desc: {
    fontSize: 14,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    lineHeight: 20,
    marginBottom: 10,
  },
});
