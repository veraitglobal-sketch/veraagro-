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
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ViewShot, { type CaptureOptions } from 'react-native-view-shot';
import Svg, { Polyline } from 'react-native-svg';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ChevronLeft } from 'lucide-react-native';
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as Error).message) : 'Error';
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
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as Error).message) : 'Error';
      Alert.alert(t('logistics.receiverProof.pdfErrTitle'), msg);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 8,
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
            {t('logistics.receiverProof.back')}
          </Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '300', color: theme.colors.text.primary }}>
          {t('logistics.receiverProof.title')}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: theme.colors.text.secondary,
            marginTop: 4,
            lineHeight: 18,
          }}
        >
          {t('logistics.receiverProof.subtitle')}
        </Text>
      </View>

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
                          {m.batch?.batchId || m.batchId || '—'} · {m.status}
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
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  hintSmall: {
    fontSize: 11,
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
  missionSub: { fontSize: 11, color: theme.colors.text.secondary, marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  submit: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  pdfBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pdfBtnText: { color: theme.colors.primary, fontSize: 15, fontWeight: '600' },
});
