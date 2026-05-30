import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { computeNextStep, type NextStep } from './computeNextStep';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';

export interface NextStepCardProps {
  estateCount: number;
  totalParcels: number;
  pendingApproval: number;
  approved: number;
  activeMissions: number;
  offlinePending: number;
  legacyFieldLogPending?: number;
  unreadNotifications?: number;
  batchesReadyForTransport: number;
  ready: boolean;
  syncError?: string | null;
  syncing?: boolean;
  onAddField: () => void;
  onAddParcel: () => void;
  onMissions: () => void;
  onRequestTransport: () => void;
  onSteps: () => void;
  onFieldLog: () => void;
  onSyncNow?: () => void;
  onNotifications?: () => void;
}

function labelAndCta(
  t: (k: string, o?: Record<string, string | number>) => string,
  step: NextStep,
  props: NextStepCardProps,
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
    case 'sync_queue':
      return {
        title: t('producer.dashboard.nextStep.syncTitle', { count: step.pendingCount ?? 1 }),
        body: t('producer.dashboard.nextStep.syncBody'),
        cta: t('producer.dashboard.syncStrip.syncNow'),
        onPress: props.onSyncNow ?? props.onFieldLog,
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
    case 'notifications':
      return {
        title: t('producer.dashboard.nextStep.notificationsTitle', { count: step.pendingCount ?? 1 }),
        body: t('producer.dashboard.nextStep.notificationsBody'),
        cta: t('producer.dashboard.nextStep.notificationsCta'),
        onPress: props.onNotifications ?? props.onMissions,
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
        title: t('producer.dashboard.nextStep.allGoodTitle'),
        body: t('producer.dashboard.nextStep.allGoodBody'),
        cta: t('producer.dashboard.nextStep.allGoodCta'),
        onPress: props.onFieldLog,
      };
  }
}

function NextStepSkeleton() {
  return (
    <View style={[enterpriseUi.authPanel, styles.skeletonPanel]} accessibilityElementsHidden>
      <View style={styles.skelLineWide} />
      <View style={styles.skelLine} />
      <View style={styles.skelCta} />
    </View>
  );
}

/** Hero action card — white panel + primary CTA (different from provenance ribbon). */
export default function NextStepCard(props: NextStepCardProps) {
  const { t } = useTranslation();
  if (!props.ready) {
    return <NextStepSkeleton />;
  }

  const step = computeNextStep({
    estateCount: props.estateCount,
    totalParcels: props.totalParcels,
    pendingApproval: props.pendingApproval,
    approved: props.approved,
    activeMissions: props.activeMissions,
    offlinePending: props.offlinePending,
    legacyFieldLogPending: props.legacyFieldLogPending,
    unreadNotifications: props.unreadNotifications,
    batchesReadyForTransport: props.batchesReadyForTransport,
  });
  if (!step) return <NextStepSkeleton />;

  const { title, body, cta, onPress } = labelAndCta(t, step, props);
  const showSyncError = step.kind === 'sync_queue' && props.syncError;

  return (
    <View style={[enterpriseUi.authPanel, styles.panel, styles.panelHero, styles.panelElevated]}>
      <View style={styles.heroAccent} accessibilityElementsHidden />
      <View style={styles.panelInner}>
      <Text style={enterpriseUi.inAppSectionLabel}>{t('producer.dashboard.nextStep.eyebrow')}</Text>
      <Text style={styles.headline}>{title}</Text>
      <Text style={enterpriseUi.inAppLead} numberOfLines={3}>
        {body}
      </Text>
      {showSyncError ? (
        <Text style={styles.syncError} numberOfLines={2}>
          {props.syncError}
        </Text>
      ) : null}
      <TouchableOpacity
        onPress={onPress}
        disabled={props.syncing && step.kind === 'sync_queue'}
        activeOpacity={0.88}
        style={[
          enterpriseUi.authSubmit,
          styles.cta,
          props.syncing && step.kind === 'sync_queue' ? styles.ctaDisabled : null,
        ]}
        accessibilityRole="button"
      >
        <Text style={[enterpriseUi.authSubmitText, styles.ctaText]}>{cta}</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  panelHero: {
    position: 'relative',
  },
  panelElevated: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  heroAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: enterpriseColors.primary,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  panelInner: {
    paddingLeft: 4,
  },
  headline: {
    fontSize: 22,
    fontWeight: '400',
    color: enterpriseColors.gray900,
    letterSpacing: -0.5,
    lineHeight: 28,
    marginTop: 4,
    marginBottom: 8,
  },
  syncError: {
    fontSize: 14,
    fontWeight: '500',
    color: enterpriseColors.destructive,
    marginTop: 10,
    lineHeight: 19,
  },
  cta: {
    marginTop: 22,
    minHeight: 52,
    justifyContent: 'center',
  },
  ctaText: {
    textAlign: 'center',
    width: '100%',
  },
  ctaDisabled: {
    opacity: 0.65,
  },
  skeletonPanel: {
    gap: 10,
    marginBottom: 12,
  },
  skelLineWide: {
    height: 18,
    borderRadius: 6,
    backgroundColor: enterpriseColors.gray100,
    width: '72%',
  },
  skelLine: {
    height: 14,
    borderRadius: 6,
    backgroundColor: enterpriseColors.gray100,
    width: '90%',
  },
  skelCta: {
    height: 52,
    borderRadius: 12,
    backgroundColor: enterpriseColors.gray100,
    marginTop: 6,
  },
});
