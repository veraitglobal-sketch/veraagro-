import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sprout, ChevronRight, Package, Truck } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
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
    case 'offline_sync':
      return {
        title: t('producer.dashboard.nextStep.syncTitle', { count: step.syncPending ?? 0 }),
        body: t('producer.dashboard.nextStep.syncBody'),
        cta: t('producer.dashboard.nextStep.syncCta'),
        onPress: props.onFieldLog,
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
  if (!props.ready) {
    return null;
  }

  const step = computeNextStep({
    estateCount: props.estateCount,
    totalParcels: props.totalParcels,
    pendingApproval: props.pendingApproval,
    approved: props.approved,
    activeMissions: props.activeMissions,
    offlinePending: props.offlinePending,
    batchesReadyForTransport: props.batchesReadyForTransport,
  });
  if (!step) {
    return null;
  }

  const { title, body, cta, onPress } = labelAndCta(t, step, props);

  return (
    <View
      style={{
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryLight,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: theme.borderRadius.md,
            backgroundColor: theme.colors.background,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: theme.spacing.sm,
          }}
        >
          {step.kind === 'log_work' || step.kind === 'offline_sync' ? (
            <Package size={20} color={theme.colors.primary} strokeWidth={1.5} />
          ) : step.kind === 'request_transport' || step.kind === 'missions' ? (
            <Truck size={20} color={theme.colors.primary} strokeWidth={1.5} />
          ) : (
            <Sprout size={20} color={theme.colors.primary} strokeWidth={1.5} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {t('producer.dashboard.nextStep.eyebrow')}
          </Text>
          <Text style={{ fontSize: 17, fontWeight: '600', color: theme.colors.text.primary, marginTop: 2 }}>{title}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 15, color: theme.colors.text.secondary, lineHeight: 22, marginBottom: theme.spacing.sm }}>{body}</Text>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.colors.primary,
          borderRadius: theme.borderRadius.md,
          paddingVertical: 16,
          paddingHorizontal: 16,
          minHeight: 52,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.inverse }}>{cta}</Text>
        <ChevronRight size={20} color={theme.colors.text.inverse} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}
