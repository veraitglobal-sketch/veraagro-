import { useCallback, useRef, useState } from 'react';
import { View, Text, Alert, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { harvestAnnouncementsAPI } from '../../../lib/api';
import { apiErrorMessage } from '../../../lib/api-error';
import { EnterpriseButton } from '../../../design-system/EnterpriseButton';
import { useAppLocaleTag } from '../../../lib/date-locale';

type Plan = { id: string; parcelId: string; batches?: Array<{ id: string; batchId: string; status: string }>; cropType: string; estimatedDate: string; status: string; announcementType: string;
  mission?: { id: string; missionNumber: string; status: string } | null };

/** Persisted server plans stay actionable after an app restart, including failed mission creation. */
export function HarvestTransportStatus({ busy }: { busy: boolean }) {
  const { t } = useTranslation();
  const locale = useAppLocaleTag();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const retryLock = useRef(false);
  const request = useRef(0);
  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    setFailed(false);
    try {
      const result = await harvestAnnouncementsAPI.getMy() as Plan[];
      if (current === request.current) setPlans(result.filter((p) => p.announcementType === 'HARVEST' && p.status !== 'CANCELLED'));
    } catch {
      if (current === request.current) setFailed(true);
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => {
    if (!busy) void load();
    return () => { request.current++; };
  }, [busy, load]));
  const retry = async (id: string) => {
    if (retryLock.current) return;
    retryLock.current = true;
    setRetrying(id);
    try {
      const mission = await harvestAnnouncementsAPI.retryTransport(id);
      await load();
      router.push({ pathname: '/(producer)/mission/[id]', params: { id: mission.id } });
    } catch (error) {
      Alert.alert(t('error'), apiErrorMessage(error, t('harvestWorkflow.retryFailed')));
    } finally {
      retryLock.current = false;
      setRetrying(null);
    }
  };
  if (loading) return <ActivityIndicator />;
  if (failed) {
    return (
      <View style={failStyles.box}>
        <Text style={failStyles.text}>{t('harvestWorkflow.reload')}</Text>
        <TouchableOpacity onPress={() => void load()} hitSlop={8} accessibilityRole="button">
          <Text style={failStyles.retry}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!plans.length) return null;
  return <View style={{ gap: 12, marginBottom: 20 }}>
    <Text>{t('harvestWorkflow.savedPlans')}</Text>
    {plans.map((plan) => <View key={plan.id} style={{ gap: 8, padding: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10 }}>
      <Text>{plan.cropType} · {new Date(plan.estimatedDate).toLocaleDateString(locale)}</Text>
      {plan.batches?.map(batch => <EnterpriseButton key={batch.id} variant="secondary"
        label={`${t('connectedWorkflow.openLot')} · ${batch.batchId}`}
        onPress={() => router.push({ pathname: '/(producer)/batch/[id]', params: { id: batch.id } })} />)}
      <EnterpriseButton variant="secondary" label={t('connectedWorkflow.createLot')}
        onPress={() => router.push({ pathname: '/(producer)/batch-new', params: { harvestAnnouncementId: plan.id, parcelId: plan.parcelId } })} />
      {plan.mission ? <>
        <Text>{plan.mission.missionNumber} · {plan.mission.status}</Text>
        <EnterpriseButton label={t('harvestWorkflow.openMission')}
          onPress={() => router.push({ pathname: '/(producer)/mission/[id]', params: { id: plan.mission!.id } })} />
      </> : plan.status !== 'COMPLETED' ? <>
        <Text>{t('harvestWorkflow.savedWithoutTransport')}</Text>
        <EnterpriseButton label={t('harvestWorkflow.retryTransport')} loading={retrying === plan.id}
          disabled={retrying !== null} onPress={() => void retry(plan.id)} />
      </> : null}
    </View>)}
  </View>;
}

const failStyles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
    backgroundColor: enterpriseColors.destructiveTint,
  },
  text: { flex: 1, fontSize: 13, color: enterpriseColors.destructive, lineHeight: 18 },
  retry: { fontSize: 13, fontWeight: '600', color: enterpriseColors.primary },
});
