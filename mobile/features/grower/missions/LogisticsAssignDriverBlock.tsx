import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { UserCheck } from 'lucide-react-native';
import { missionsAPI, logisticsDriversAPI, type Mission, type LogisticsDriverRow } from '../../../lib/api';
import { apiErrorMessage } from '../../../lib/api-error';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { useAuth } from '../../../hooks/useAuth';
import { MissionDetailSection } from './MissionDetailSection';

/** Before the truck leaves the farm the carrier can still (re)assign who drives. */
const DRIVER_EDITABLE = new Set(['ASSIGNED', 'ACCEPTED', 'READY_FOR_LOADING']);

export function LogisticsAssignDriverBlock({ mission, onChanged }: { mission: Mission; onChanged: () => void | Promise<void> }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<LogisticsDriverRow[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const mine = Boolean(user?.id) && mission.logisticsPartnerId === user?.id;
  const editable = mine && DRIVER_EDITABLE.has(String(mission.status ?? '').toUpperCase());

  const load = useCallback(async () => {
    try {
      setDrivers((await logisticsDriversAPI.list()).filter((d) => d.isActive));
    } catch {
      setDrivers([]);
    }
  }, []);

  useEffect(() => {
    if (editable) void load();
  }, [editable, load]);

  if (!editable) return null;

  const current = mission.assignedLogisticsDriverId ?? null;

  const assign = async (driverId: string) => {
    if (driverId === current) return;
    setBusyId(driverId);
    try {
      await missionsAPI.setLogisticsDriver(mission.id, driverId);
      await onChanged();
    } catch (e) {
      Alert.alert(t('error'), apiErrorMessage(e, t('common.tryAgain')));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <MissionDetailSection title={t('logistics.assignDriver.title')} icon={UserCheck}>
      <Text style={styles.hint}>{t('logistics.assignDriver.hint')}</Text>
      {drivers === null ? (
        <ActivityIndicator color={enterpriseColors.primary} style={{ marginVertical: 8 }} />
      ) : drivers.length === 0 ? (
        <TouchableOpacity
          onPress={() => router.push('/(logistics)/drivers')}
          style={styles.addLink}
          accessibilityRole="button"
        >
          <Text style={styles.addLinkText}>{t('logistics.assignDriver.noDrivers')}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.chips}>
          {drivers.map((d) => {
            const on = d.id === current;
            return (
              <TouchableOpacity
                key={d.id}
                onPress={() => void assign(d.id)}
                disabled={busyId !== null}
                activeOpacity={0.7}
                style={[styles.chip, on && styles.chipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                {busyId === d.id ? (
                  <ActivityIndicator size="small" color={on ? '#fff' : enterpriseColors.primary} />
                ) : (
                  <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>
                    {`${d.firstName} ${d.lastName}`.trim()}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </MissionDetailSection>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 12.5, lineHeight: 17, color: enterpriseColors.gray600 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    minWidth: 90,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.12)',
    backgroundColor: enterpriseColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: '#1F3D1B', borderColor: '#1F3D1B' },
  chipText: { fontSize: 13.5, fontWeight: '600', color: enterpriseColors.gray700 },
  chipTextOn: { color: '#fff' },
  addLink: { paddingVertical: 6 },
  addLinkText: { fontSize: 13.5, fontWeight: '600', color: enterpriseColors.primary },
});
