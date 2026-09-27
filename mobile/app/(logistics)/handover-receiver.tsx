import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  PanResponder,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GrowerStackHeader } from '../../components/grower/GrowerStackHeader';
import { useTranslation } from 'react-i18next';
import { getMissionStatusLabelLocalized } from '../../lib/mission-status';
import ViewShot, { type CaptureOptions } from 'react-native-view-shot';
import Svg, { Polyline } from 'react-native-svg';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { missionsAPI, qualityEntryAPI, type Mission } from '../../lib/api';

const AFTER_LOADING: string[] = [
  'READY_FOR_LOADING',
  'PICKED_UP',
  'IN_TRANSIT',
  'COMPLETED',
];

const SIG_W = 300;
const SIG_H = 160;

type Point = { x: number; y: number };

const viewShotOptions: CaptureOptions = {
  format: 'png',
  quality: 0.95,
  result: 'data-uri',
};

function hasStrokes(strokes: Point[][]): boolean {
  return strokes.some((s) => s.length >= 2);
}

export default function HandoverReceiverScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = useBioVeraScreenPadding();
  const viewShotRef = useRef<InstanceType<typeof ViewShot> | null>(null);

  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useLocalSearchParams<{ missionId?: string | string[] }>();
  const requestedId = Array.isArray(params.missionId) ? params.missionId[0] : params.missionId;
  const [choice, setChoice] = useState<{ route?: string; id: string } | null>(null);
  const reference = choice?.route === requestedId ? choice?.id : requestedId;
  const selectedId = missions.some((m) => m.id === reference) ? reference : null;
  const setSelectedId = (id: string) => setChoice({ route: requestedId, id });
  const [receiverName, setReceiverName] = useState('');
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const loadMissions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await missionsAPI.getAll({ scope: 'logistics' });
      const list = (Array.isArray(data) ? data : []).filter((m) =>
        AFTER_LOADING.includes(m.status),
      );
      setMissions(list);
    } catch {
      setMissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMissions();
  }, [loadMissions]);

  useEffect(() => { setReceiverName(''); setStrokes([]); }, [selectedId]);

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

  const clearPad = () => {
    setStrokes([]);
  };

  const onSubmit = async () => {
    if (!selectedId) {
      Alert.alert('', t('logistics.receiverProof.errMission'));
      return;
    }
    if (!receiverName.trim()) {
      Alert.alert('', t('logistics.receiverProof.errName'));
      return;
    }
    setSubmitting(true);
    let receiverSignatureDataUrl: string | undefined;
    if (hasStrokes(strokes) && viewShotRef.current?.capture) {
      try {
        const uri = await viewShotRef.current.capture();
        if (uri?.startsWith('data:image')) {
          receiverSignatureDataUrl = uri;
        }
      } catch {
        // name-only
      }
    }
    try {
      await qualityEntryAPI.submitHandoverReceiverProof({
        missionId: selectedId,
        receiverName: receiverName.trim(),
        receiverSignatureDataUrl,
      });
      clearPad();
      setReceiverName('');
      Alert.alert(t('logistics.receiverProof.doneTitle'), t('logistics.receiverProof.doneBody'));
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as Error).message)
          : t('logistics.receiverProof.errorDetailFallback');
      Alert.alert(t('logistics.receiverProof.errTitle'), msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onOpenPdf = async () => {
    if (!selectedId) return;
    setPdfLoading(true);
    try {
      const ab = await qualityEntryAPI.getHandoverReceiverPdf(selectedId);
      const out = new File(Paths.cache, `handover-receiver-${selectedId}.pdf`);
      if (out.exists) {
        out.delete();
      }
      out.create();
      out.write(new Uint8Array(ab));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(out.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert('', t('logistics.receiverProof.shareUnavailable'));
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as Error).message)
          : t('logistics.receiverProof.errorDetailFallback');
      Alert.alert(t('logistics.receiverProof.pdfErrTitle'), msg);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <GrowerStackHeader
        title={t('logistics.receiverProof.title')}
        subtitle={t('logistics.receiverProof.subtitle')}
        onBack={() => router.back()}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: p.screenPaddingLeft,
          paddingTop: theme.spacing.md,
          paddingBottom: Math.max(insets.bottom, theme.spacing.xl),
        }}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <>
            {reference && !selectedId ? <Text style={styles.hint}>{t('deliveryFlow.missionUnavailable')}</Text> : null}
            <Text style={styles.label}>{t('logistics.receiverProof.mission')}</Text>
            {missions.length === 0 ? (
              <Text style={styles.hint}>{t('logistics.receiverProof.noMissions')}</Text>
            ) : (
              <View style={{ gap: 8, marginBottom: 16 }}>
                {missions.map((m) => {
                  const id = m.id;
                  const sel = selectedId === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      onPress={() => setSelectedId(id)}
                      activeOpacity={0.7}
                      style={[
                        styles.missionRow,
                        sel && { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.missionNo}>{m.missionNumber || id}</Text>
                        <Text style={styles.missionSub}>
                          {m.batch?.batchId || m.batchId || '—'} · {getMissionStatusLabelLocalized(m.status, t)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.radio,
                          sel && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
                        ]}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={styles.label}>{t('logistics.receiverProof.name')}</Text>
            <TextInput
              value={receiverName}
              onChangeText={setReceiverName}
              placeholder={t('logistics.receiverProof.namePh')}
              placeholderTextColor={theme.colors.text.tertiary}
              style={styles.input}
              autoCapitalize="words"
            />

            <View style={styles.padHeader}>
              <Text style={styles.label}>{t('logistics.receiverProof.signature')}</Text>
              <TouchableOpacity onPress={clearPad} hitSlop={8}>
                <Text style={styles.clear}>{t('logistics.receiverProof.clear')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.shotWrap} collapsable={false}>
              <ViewShot
                ref={viewShotRef}
                options={viewShotOptions}
                style={styles.shotInner}
              >
                <View
                  style={styles.padTouch}
                  collapsable={false}
                  {...panResponder.panHandlers}
                >
                  <Svg width={SIG_W} height={SIG_H} style={StyleSheet.absoluteFill}>
                    {strokes.map((line, i) => (
                      <Polyline
                        key={i}
                        points={line.map((p) => `${p.x},${p.y}`).join(' ')}
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
            <Text style={styles.hintSmall}>{t('logistics.receiverProof.sigHint')}</Text>

            <TouchableOpacity
              onPress={onSubmit}
              disabled={submitting || !selectedId || !receiverName.trim()}
              style={[
                styles.submit,
                (!selectedId || !receiverName.trim() || submitting) && { opacity: 0.5 },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>{t('logistics.receiverProof.save')}</Text>
              )}
            </TouchableOpacity>

            {!!selectedId && (
              <TouchableOpacity
                onPress={() => void onOpenPdf()}
                disabled={pdfLoading}
                style={styles.pdfBtn}
              >
                {pdfLoading ? (
                  <ActivityIndicator color={theme.colors.primary} />
                ) : (
                  <Text style={styles.pdfBtnText}>{t('logistics.receiverProof.openPdf')}</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  hint: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  hintSmall: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    marginTop: 6,
    marginBottom: 16,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  padHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  clear: { fontSize: 13, color: theme.colors.primary, fontWeight: '600' },
  shotWrap: {
    width: SIG_W,
    maxWidth: '100%',
    borderRadius: theme.borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.15)',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  shotInner: { width: SIG_W, height: SIG_H, backgroundColor: '#fff' },
  padTouch: { width: SIG_W, height: SIG_H, backgroundColor: '#fff' },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: theme.colors.surface,
  },
  missionNo: { fontSize: 14, color: theme.colors.text.primary, fontWeight: '500' },
  missionSub: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  submit: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    minHeight: 50,
    justifyContent: 'center',
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  pdfBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pdfBtnText: { color: theme.colors.primary, fontSize: 15, fontWeight: '600' },
});
