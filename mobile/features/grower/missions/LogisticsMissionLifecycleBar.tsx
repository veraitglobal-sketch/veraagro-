import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { missionsAPI, Mission } from '../../../lib/api';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';

type Step = 'DEPART_FARM' | 'START_TRANSIT' | 'COMPLETE_DELIVERY';

interface Props {
  mission: Mission;
  onUpdated: () => void;
}

export default function LogisticsMissionLifecycleBar({ mission, onUpdated }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<string | null>(null);

  const status = mission.status ?? '';

  if (!['READY_FOR_LOADING', 'PICKED_UP', 'IN_TRANSIT'].includes(String(status))) {
    return null;
  }

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

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('logistics.lifecycleTitle')}</Text>
      <Text style={styles.hint}>{t('logistics.lifecycleHint')}</Text>
      <View style={styles.row}>
        {status === 'READY_FOR_LOADING' && (
          <TouchableOpacity
            style={styles.btn}
            onPress={() => void run('DEPART_FARM')}
            disabled={busy !== null}
          >
            {busy === `${mission.id}:DEPART_FARM` ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{t('logistics.lifecycleDepart')}</Text>
            )}
          </TouchableOpacity>
        )}
        {status === 'PICKED_UP' && (
          <TouchableOpacity
            style={styles.btn}
            onPress={() => void run('START_TRANSIT')}
            disabled={busy !== null}
          >
            {busy === `${mission.id}:START_TRANSIT` ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{t('logistics.lifecycleTransit')}</Text>
            )}
          </TouchableOpacity>
        )}
        {status === 'IN_TRANSIT' && (
          <TouchableOpacity
            style={styles.btn}
            onPress={() => void run('COMPLETE_DELIVERY')}
            disabled={busy !== null}
          >
            {busy === `${mission.id}:COMPLETE_DELIVERY` ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{t('logistics.lifecycleDelivered')}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(45, 90, 39, 0.25)',
    backgroundColor: 'rgba(247, 250, 246, 0.9)',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  hint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 6,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
    gap: 8,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    minWidth: 140,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});
