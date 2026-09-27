import { useCallback, useRef, useState } from 'react';
import { Text, View, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { isAxiosError } from 'axios';
import { AlertCircle } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { batchesAPI, type BatchWorkflowContext } from '../../../lib/api/batches';
import { EnterpriseButton } from '../../../design-system/EnterpriseButton';
import { useAppLocaleTag } from '../../../lib/date-locale';

export function BatchHarvestContext({ batchId }: { batchId: string }) {
  const { t } = useTranslation();
  const locale = useAppLocaleTag();
  const router = useRouter();
  const [data, setData] = useState<BatchWorkflowContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const request = useRef(0);
  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    setFailed(false);
    try {
      const result = await batchesAPI.getWorkflow(batchId);
      if (current === request.current) setData(result);
    } catch (error) {
      // 404 = server without the workflow endpoint yet: nothing to link, not an error to retry.
      if (current === request.current) {
        if (isAxiosError(error) && error.response?.status === 404) setData(null);
        else setFailed(true);
      }
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [batchId]);
  useFocusEffect(useCallback(() => {
    void load();
    return () => { request.current++; };
  }, [load]));
  if (loading) return <ActivityIndicator color={enterpriseColors.primary} style={{ marginVertical: 12 }} />;
  if (failed) {
    return (
      <View style={styles.errorBox}>
        <AlertCircle size={16} color={enterpriseColors.destructive} strokeWidth={1.9} />
        <Text style={styles.errorText}>{t('harvestWorkflow.reload')}</Text>
        <TouchableOpacity onPress={() => void load()} hitSlop={8} accessibilityRole="button">
          <Text style={styles.retry}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!data) return null;
  return (
    <View style={styles.panel}>
      <Text style={styles.label}>{t('harvestWorkflow.planTitle')}</Text>
      <Text style={styles.body}>{data.harvestPlan
        ? `${data.harvestPlan.cropType} · ${new Date(data.harvestPlan.estimatedDate).toLocaleDateString(locale)} · ${data.harvestPlan.status}`
        : t('harvestWorkflow.noPlan')}</Text>
      {data.harvestPlan?.sourcePlantingId && data.harvestPlan.parcelId ? (
        <EnterpriseButton label={t('connectedWorkflow.openWorkLog')}
          onPress={() => router.push({ pathname: '/(producer)/field-diary', params: {
            parcelId: data.harvestPlan!.parcelId!, plantingId: data.harvestPlan!.sourcePlantingId!,
          } })} />
      ) : null}
      {data.mission ? (
        <>
          <Text style={styles.body}>{data.mission.missionNumber} · {data.mission.status}</Text>
          {data.mission.batchId !== batchId ? <Text style={styles.muted}>{t('harvestWorkflow.planMissionNotLinked')}</Text> : null}
          <EnterpriseButton label={t('harvestWorkflow.openMission')}
            onPress={() => router.push({ pathname: '/(producer)/mission/[id]', params: { id: data.mission!.id } })} />
        </>
      ) : <Text style={styles.muted}>{t('harvestWorkflow.noMission')}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { ...enterpriseUi.inAppPanel, padding: 14, gap: 8, marginVertical: 8 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: '#6B7A67',
  },
  body: { fontSize: 14, color: enterpriseColors.gray900, lineHeight: 19 },
  muted: { fontSize: 12.5, color: enterpriseColors.gray600, lineHeight: 17 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
    backgroundColor: enterpriseColors.destructiveTint,
  },
  errorText: { flex: 1, fontSize: 13, color: enterpriseColors.destructive, lineHeight: 18 },
  retry: { fontSize: 13, fontWeight: '600', color: enterpriseColors.primary },
});
