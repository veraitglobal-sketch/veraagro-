import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { missionsAPI, Mission } from '../../../lib/api';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { EnterpriseNotice } from '../../../components/enterprise/EnterpriseNotice';

type Step = 'DEPART_FARM' | 'START_TRANSIT' | 'COMPLETE_DELIVERY';

const BEFORE_LOADING_DONE: string[] = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'];

interface Props {
  mission: Mission;
  onUpdated: () => void;
}

export default function LogisticsMissionLifecycleBar({ mission, onUpdated }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const status = mission.status ?? '';
  const loadingHandoverRequired = BEFORE_LOADING_DONE.includes(String(status));

  const run = async (step: Step) => {
    const key = `${mission.id}:${step}`;
    setBusy(key);
    try {
      await missionsAPI.advanceMissionLifecycle(mission.id, step);
      onUpdated();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const text =
        typeof msg === 'string' ? msg : Array.isArray(msg) ? msg.join(' ') : t('logistics.lifecycleErr');
      Alert.alert(t('logistics.lifecycleErrTitle'), text);
    } finally {
      setBusy(null);
    }
  };

  const openLoadingHandover = () => {
    router.push(`/(logistics)/handover-loading?missionId=${encodeURIComponent(mission.id)}`);
  };

  if (loadingHandoverRequired) {
    return (
      <EnterpriseNotice
        title={t('logistics.loadingHandover.needTitle')}
        body={t('logistics.loadingHandover.needBody')}
        onPress={openLoadingHandover}
        actionLabel={t('logistics.loadingHandover.needCta')}
      />
    );
  }

  if (!['READY_FOR_LOADING', 'PICKED_UP', 'IN_TRANSIT'].includes(String(status))) {
    return null;
  }

  return (
    <View style={[enterpriseUi.inAppPanel, styles.wrap]}>
      <Text style={enterpriseUi.navRowTitle}>{t('logistics.lifecycleTitle')}</Text>
      <Text style={[enterpriseUi.navRowSubtitle, styles.hint]}>{t('logistics.lifecycleHint')}</Text>
      <View style={styles.row}>
        {status === 'READY_FOR_LOADING' && (
          <TouchableOpacity
            style={enterpriseUi.authBtnPrimary}
            onPress={() => void run('DEPART_FARM')}
            disabled={busy !== null}
          >
            {busy === `${mission.id}:DEPART_FARM` ? (
              <ActivityIndicator color={enterpriseColors.white} />
            ) : (
              <Text style={enterpriseUi.authBtnPrimaryText}>{t('logistics.lifecycleDepart')}</Text>
            )}
          </TouchableOpacity>
        )}
        {status === 'PICKED_UP' && (
          <TouchableOpacity
            style={enterpriseUi.authBtnPrimary}
            onPress={() => void run('START_TRANSIT')}
            disabled={busy !== null}
          >
            {busy === `${mission.id}:START_TRANSIT` ? (
              <ActivityIndicator color={enterpriseColors.white} />
            ) : (
              <Text style={enterpriseUi.authBtnPrimaryText}>{t('logistics.lifecycleTransit')}</Text>
            )}
          </TouchableOpacity>
        )}
        {status === 'IN_TRANSIT' && (
          <TouchableOpacity
            style={enterpriseUi.authBtnPrimary}
            onPress={() => void run('COMPLETE_DELIVERY')}
            disabled={busy !== null}
          >
            {busy === `${mission.id}:COMPLETE_DELIVERY` ? (
              <ActivityIndicator color={enterpriseColors.white} />
            ) : (
              <Text style={enterpriseUi.authBtnPrimaryText}>{t('logistics.lifecycleDelivered')}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    padding: 16,
  },
  hint: {
    marginTop: 6,
    marginBottom: 12,
  },
  row: {
    gap: 10,
  },
});
