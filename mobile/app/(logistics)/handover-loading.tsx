/**
 * Logistics partner: record loading handover at farm (same contract as web /quality-entry/handover).
 * Required before lifecycle "Truck left farm" (READY_FOR_LOADING → PICKED_UP).
 */
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
  PanResponder,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import ViewShot, { type CaptureOptions } from 'react-native-view-shot';
import Svg, { Polyline } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';

import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import {
  missionsAPI,
  logisticsDriversAPI,
  qualityEntryAPI,
  type Mission,
  type LogisticsDriverRow,
} from '../../lib/api';
import { apiErrorMessage } from '../../lib/api-error';

const PENDING_HANDOVER_STATUSES = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] as const;

const SIG_W = 300;
const SIG_H = 160;

const viewShotOptions: CaptureOptions = {
  format: 'png',
  quality: 0.95,
  result: 'data-uri',
};

type Point = { x: number; y: number };

function hasStrokes(strokes: Point[][]): boolean {
  return strokes.some((s) => s.length >= 2);
}

function parseLocaleTemperature(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, '').replace(',', '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

async function uriToJpegDataUrl(uri: string): Promise<string> {
  const b64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
  return `data:image/jpeg;base64,${b64}`;
}

export default function HandoverLoadingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = useBioVeraScreenPadding();
  const params = useLocalSearchParams<{ missionId?: string }>();
  const presetMissionId =
    typeof params.missionId === 'string'
      ? params.missionId
      : Array.isArray(params.missionId)
        ? params.missionId[0]
        : undefined;

  const viewShotRef = useRef<InstanceType<typeof ViewShot> | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [drivers, setDrivers] = useState<LogisticsDriverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(presetMissionId ?? null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [palletUri, setPalletUri] = useState<string | null>(null);
  const [truckUri, setTruckUri] = useState<string | null>(null);
  const [badgeUri, setBadgeUri] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pickingKind, setPickingKind] = useState<'pallet' | 'truck' | 'badge' | null>(null);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (ev) => {
          const { locationX, locationY } = ev.nativeEvent;
          setStrokes((prev) => [...prev, [{ x: locationX, y: locationY }]]);
        },
        onPanResponderMove: (ev) => {
          const { locationX, locationY } = ev.nativeEvent;
          setStrokes((prev) => {
            if (prev.length === 0) {
              return [[{ x: locationX, y: locationY }]];
            }
            const next = prev.slice();
            const last = next[next.length - 1]!.concat({ x: locationX, y: locationY });
            next[next.length - 1] = last;
            return next;
          });
        },
        onPanResponderRelease: () => {},
      }),
    [],
  );

  const clearPad = () => setStrokes([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mData, dData] = await Promise.all([
        missionsAPI.getAll({ scope: 'logistics' }),
        logisticsDriversAPI.list().catch(() => [] as LogisticsDriverRow[]),
      ]);
      const list = (Array.isArray(mData) ? mData : []).filter((m) =>
        PENDING_HANDOVER_STATUSES.includes(m.status as (typeof PENDING_HANDOVER_STATUSES)[number]),
      );
      setMissions(list);
      setDrivers((Array.isArray(dData) ? dData : []).filter((d) => d.isActive !== false));
      if (presetMissionId && !list.some((m) => m.id === presetMissionId)) {
        setSelectedMissionId(null);
      }
    } catch {
      setMissions([]);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, [presetMissionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const takePhoto = async (kind: 'pallet' | 'truck' | 'badge') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('alerts.warning'), t('producer.scanner.cameraPermissionBody'));
      return;
    }
    setPickingKind(kind);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.75,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        if (kind === 'pallet') setPalletUri(uri);
        else if (kind === 'truck') setTruckUri(uri);
        else setBadgeUri(uri);
      }
    } finally {
      setPickingKind(null);
    }
  };

  const onSubmit = async () => {
    if (!selectedMissionId) {
      Alert.alert('', t('logistics.loadingHandover.errMission'));
      return;
    }
    const temp = parseLocaleTemperature(temperature);
    if (temp == null || temp < -10 || temp > 15) {
      Alert.alert('', t('logistics.loadingHandover.errTemp'));
      return;
    }
    if (!selectedDriverId) {
      Alert.alert('', t('logistics.loadingHandover.errDriver'));
      return;
    }
    if (!palletUri || !truckUri || !badgeUri) {
      Alert.alert('', t('logistics.loadingHandover.errPhotos'));
      return;
    }
    if (!hasStrokes(strokes)) {
      Alert.alert('', t('logistics.loadingHandover.errSig'));
      return;
    }

    let pickupDriverSignatureDataUrl = '';
    if (viewShotRef.current?.capture) {
      try {
        pickupDriverSignatureDataUrl = await viewShotRef.current.capture();
      } catch {
        Alert.alert('', t('logistics.loadingHandover.errSigCapture'));
        return;
      }
    }
    if (!pickupDriverSignatureDataUrl.startsWith('data:image')) {
      Alert.alert('', t('logistics.loadingHandover.errSigCapture'));
      return;
    }

    setSubmitting(true);
    try {
      const [palletPhotos, truckInteriorPhotos, pickupBadgePhoto] = await Promise.all([
        uriToJpegDataUrl(palletUri),
        uriToJpegDataUrl(truckUri),
        uriToJpegDataUrl(badgeUri),
      ]);
      await qualityEntryAPI.submitLoadingHandover({
        missionId: selectedMissionId,
        insideTruckTemperature: temp,
        palletPhotos: [palletPhotos],
        truckInteriorPhotos: [truckInteriorPhotos],
        notes: notes.trim() || undefined,
        pickupDriverId: selectedDriverId,
        pickupBadgePhoto,
        pickupDriverSignatureDataUrl,
      });
      Alert.alert(t('logistics.loadingHandover.doneTitle'), t('logistics.loadingHandover.doneBody'), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      Alert.alert(
        t('logistics.loadingHandover.errTitle'),
        apiErrorMessage(e, t('logistics.loadingHandover.errGeneric')),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const busyPick = pickingKind !== null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          paddingTop: p.headerTop,
          paddingBottom: theme.spacing.md,
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: 'rgba(0,0,0,0.08)',
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}
        >
          <ChevronLeft size={22} color={theme.colors.text.primary} strokeWidth={1.5} />
          <Text style={{ fontSize: 14, color: theme.colors.text.secondary, fontWeight: '500' }}>
            {t('logistics.loadingHandover.back')}
          </Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text.primary }}>
          {t('logistics.loadingHandover.title')}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.text.secondary,
            marginTop: 4,
            lineHeight: 18,
          }}
        >
          {t('logistics.loadingHandover.subtitle')}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: p.screenPaddingLeft,
          paddingTop: theme.spacing.md,
          paddingBottom: Math.max(insets.bottom, theme.spacing.xl) + 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <>
            <Text style={styles.label}>{t('logistics.loadingHandover.mission')}</Text>
            {missions.length === 0 ? (
              <Text style={styles.hint}>{t('logistics.loadingHandover.noMissions')}</Text>
            ) : (
              <View style={{ gap: 8, marginBottom: 16 }}>
                {missions.map((m) => {
                  const sel = selectedMissionId === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => setSelectedMissionId(m.id)}
                      activeOpacity={0.7}
                      style={[styles.row, sel && styles.rowSel]}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text.primary }}>
                        {m.missionNumber || m.id.slice(0, 8)}
                      </Text>
                      <Text style={{ fontSize: 14, color: theme.colors.text.secondary, marginTop: 2 }}>
                        {m.batch?.batchId || m.batchId || '—'} · {m.status}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={styles.label}>{t('logistics.loadingHandover.driver')}</Text>
            {drivers.length === 0 ? (
              <Text style={styles.hint}>{t('logistics.loadingHandover.noDrivers')}</Text>
            ) : (
              <View style={{ gap: 8, marginBottom: 16 }}>
                {drivers.map((d) => {
                  const sel = selectedDriverId === d.id;
                  return (
                    <TouchableOpacity
                      key={d.id}
                      onPress={() => setSelectedDriverId(d.id)}
                      style={[styles.row, sel && styles.rowSel]}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text.primary }}>
                        {d.firstName} {d.lastName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={styles.label}>{t('logistics.loadingHandover.temp')}</Text>
            <TextInput
              value={temperature}
              onChangeText={setTemperature}
              placeholder={t('logistics.loadingHandover.tempPh')}
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text style={styles.hintSmall}>{t('logistics.loadingHandover.tempRange')}</Text>

            <Text style={[styles.label, { marginTop: 12 }]}>{t('logistics.loadingHandover.notes')}</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={t('logistics.loadingHandover.notesPh')}
              placeholderTextColor={theme.colors.text.tertiary}
              style={[styles.input, { minHeight: 72 }]}
              multiline
            />

            <PhotoBlock
              label={t('logistics.loadingHandover.pallet')}
              hint={t('logistics.loadingHandover.palletHint')}
              uri={palletUri}
              onTake={() => void takePhoto('pallet')}
              busy={busyPick && pickingKind === 'pallet'}
            />
            <PhotoBlock
              label={t('logistics.loadingHandover.truckInside')}
              hint={t('logistics.loadingHandover.truckInsideHint')}
              uri={truckUri}
              onTake={() => void takePhoto('truck')}
              busy={busyPick && pickingKind === 'truck'}
            />
            <PhotoBlock
              label={t('logistics.loadingHandover.badge')}
              hint={t('logistics.loadingHandover.badgeHint')}
              uri={badgeUri}
              onTake={() => void takePhoto('badge')}
              busy={busyPick && pickingKind === 'badge'}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.label}>{t('logistics.loadingHandover.sig')}</Text>
              <TouchableOpacity onPress={clearPad}>
                <Text style={{ fontSize: 13, color: theme.colors.primary, fontWeight: '600' }}>
                  {t('logistics.loadingHandover.clear')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.shotWrap} collapsable={false}>
              <ViewShot ref={viewShotRef} options={viewShotOptions} style={styles.shotInner}>
                <View style={styles.padTouch} collapsable={false} {...panResponder.panHandlers}>
                  <Svg width={SIG_W} height={SIG_H} style={StyleSheet.absoluteFill}>
                    {strokes.map((line, i) => (
                      <Polyline
                        key={i}
                        points={line.map((pt) => `${pt.x},${pt.y}`).join(' ')}
                        fill="none"
                        stroke="#111827"
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                  </Svg>
                </View>
              </ViewShot>
            </View>
            <Text style={styles.hintSmall}>{t('logistics.loadingHandover.sigHint')}</Text>

            <TouchableOpacity
              onPress={() => void onSubmit()}
              disabled={submitting || missions.length === 0 || drivers.length === 0}
              style={[
                styles.submit,
                (submitting || missions.length === 0 || drivers.length === 0) && { opacity: 0.5 },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>{t('logistics.loadingHandover.save')}</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function PhotoBlock({
  label,
  hint,
  uri,
  onTake,
  busy,
}: {
  label: string;
  hint: string;
  uri: string | null;
  onTake: () => void;
  busy: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.sm }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 14, color: theme.colors.text.secondary, marginBottom: 10, lineHeight: 17 }}>
        {hint}
      </Text>
      {uri ? (
        <View>
          <Image source={{ uri }} style={{ width: '100%', height: 180, borderRadius: 10 }} resizeMode="cover" />
          <TouchableOpacity onPress={onTake} disabled={busy} style={styles.retake}>
            <Camera size={18} color={theme.colors.primary} />
            <Text style={{ marginLeft: 6, fontSize: 14, color: theme.colors.primary, fontWeight: '600' }}>
              {t('logistics.loadingHandover.retake')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onTake}
          disabled={busy}
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 10,
            padding: 28,
            alignItems: 'center',
            backgroundColor: theme.colors.surfaceElevated,
          }}
        >
          {busy ? (
            <ActivityIndicator />
          ) : (
            <>
              <Camera size={40} color={theme.colors.primary} />
              <Text style={{ marginTop: 10, fontSize: 15, fontWeight: '600', color: theme.colors.primary }}>
                {t('logistics.loadingHandover.snap')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 6 },
  hint: { fontSize: 14, color: theme.colors.text.secondary, marginBottom: 12 },
  hintSmall: { fontSize: 14, color: theme.colors.text.tertiary, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.surface,
  },
  row: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    padding: 12,
  },
  rowSel: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` },
  shotWrap: { marginTop: 8, marginBottom: 8, alignItems: 'center' },
  shotInner: { width: SIG_W, height: SIG_H, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  padTouch: { flex: 1, backgroundColor: '#fafafa' },
  submit: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 52,
  },
  submitText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  retake: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'flex-start',
  },
});
