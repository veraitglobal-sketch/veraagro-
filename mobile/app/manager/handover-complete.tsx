import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, Thermometer, Image as ImageIcon, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import ViewShot, { type CaptureOptions } from 'react-native-view-shot';
import Svg, { Polyline } from 'react-native-svg';
import { theme } from '../../lib/theme';
import { prepareHandoverPhotos } from '../../lib/handover-evidence';
import { digitalHandoverAPI, type DigitalHandover } from '../../lib/api';
import { apiErrorMessage } from '../../lib/api-error';
import StepIndicator from '../../components/StepIndicator';
import { FormHelperText } from '../../components/FormHelperText';
import { farmerFormUi } from '../../lib/farmer-form-ui';

const PHOTO_COUNT = 4;
const SLOT_KEYS = ['slot0', 'slot1', 'slot2', 'slot3'] as const;
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

/**
 * Manager / store handover: visual check, temperature, four documented photos, recipient signature for OK receipt, then submit.
 */
export default function HandoverCompleteScreen() {
  const params = useLocalSearchParams<{ handoverId?: string | string[] }>();
  const handoverId = (Array.isArray(params.handoverId) ? params.handoverId[0] : params.handoverId) || '';
  return <HandoverForm key={handoverId} handoverId={handoverId} />;
}

function HandoverForm({ handoverId }: { handoverId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const viewShotRef = useRef<InstanceType<typeof ViewShot> | null>(null);
  const submitLock = useRef(false);
  const [saved, setSaved] = useState<DigitalHandover | null>(null);
  const [readFailed, setReadFailed] = useState(false);
  const [reading, setReading] = useState(true);
  const reload = useCallback(async () => {
    setReading(true); setReadFailed(false);
    try { if (!handoverId) throw new Error('Missing handover'); setSaved(await digitalHandoverAPI.getOne(handoverId)); }
    catch { setReadFailed(true); }
    finally { setReading(false); }
  }, [handoverId]);
  useEffect(() => { void reload(); }, [reload]);
  const [step, setStep] = useState(2);
  const [visualCheck, setVisualCheck] = useState<'FRESH' | 'DAMAGED' | null>(null);
  const [temperature, setTemperature] = useState('');
  const [photos, setPhotos] = useState<(string | null)[]>(() => Array(PHOTO_COUNT).fill(null));
  const [notes, setNotes] = useState('');
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState(false);

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

  const takePhoto = useCallback(
    async (index: number) => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.permissionRequired'), t('handover.permCamera'));
        return;
      }
      setPicking(true);
      try {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
          setPhotos((prev) => {
            const next = [...prev];
            next[index] = result.assets[0].uri;
            return next;
          });
        }
      } finally {
        setPicking(false);
      }
    },
    [t],
  );

  const handleComplete = async () => {
    if (submitLock.current || reading || readFailed || !saved) return;
    if (!visualCheck) {
      Alert.alert(t('common.required'), t('handover.errVisual'));
      return;
    }
    const temperatureValue = Number(temperature.trim().replace(',', '.'));
    if (!temperature.trim() || !Number.isFinite(temperatureValue)) {
      Alert.alert(t('common.required'), t('handover.errTemp'));
      return;
    }
    if (photos.some((p) => !p)) {
      Alert.alert(t('common.required'), t('handover.errPhotos'));
      return;
    }
    if (!handoverId) {
      Alert.alert(t('common.required'), t('handover.errHandoverId'));
      return;
    }

    if (visualCheck === 'FRESH' && !hasStrokes(strokes)) {
      Alert.alert(t('common.required'), t('handover.errSignature'));
      return;
    }
    submitLock.current = true;
    let signatureDataUrl: string | undefined;
    if (visualCheck === 'FRESH') {
      try {
        const uri = viewShotRef.current?.capture ? await viewShotRef.current.capture() : null;
        if (uri?.startsWith('data:image')) {
          signatureDataUrl = uri;
        }
      } catch {
        // fall through — caught below
      }
      if (!signatureDataUrl || signatureDataUrl.length < 80) {
        submitLock.current = false;
        Alert.alert(t('common.required'), t('handover.errSignatureCapture'));
        return;
      }
    }

    setLoading(true);
    try {
      const photoUrls = await prepareHandoverPhotos(photos.filter((p): p is string => p != null));
      const result = await digitalHandoverAPI.complete({
        handoverId,
        revision: saved.revision ?? 0,
        qualityCheck: {
          visualCheck,
          temperature: temperatureValue,
          photoUrls,
          notes: notes || undefined,
          ...(signatureDataUrl ? { signature: signatureDataUrl } : {}),
        },
      });
      setSaved(result);
      Alert.alert(
        t('handover.completeTitle'),
        visualCheck === 'DAMAGED' ? t('handover.doneDamaged') : t('handover.doneOk'),
        [{ text: t('common.ok'), onPress: () => void reload() }],
      );
    } catch (error: unknown) {
      Alert.alert(t('common.error'), apiErrorMessage(error, t('handover.errGeneric')));
    } finally {
      submitLock.current = false;
      setLoading(false);
    }
  };

  if (reading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (readFailed || !saved) return <View style={{ padding: 24 }}><Text>{t('deliveryFlow.loadFailed')}</Text>
    <TouchableOpacity onPress={() => void reload()}><Text>{t('common.tryAgain')}</Text></TouchableOpacity></View>;
  if (saved.status === 'COMPLETED' || saved.status === 'DISPUTED') return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 12 }}>
      <Text>{saved.status === 'DISPUTED' ? t('handover.doneDamaged') : t('handover.doneOk')}</Text>
      {saved.temperature != null ? <Text>{t('handover.tempCheck')}: {saved.temperature}</Text> : null}
      {saved.notes ? <Text>{t('handover.notes')}: {saved.notes}</Text> : null}
      {saved.photoUrls.map((uri, index) => <Image key={index} source={{ uri }} style={{ width: '100%', height: 200 }} resizeMode="contain" />)}
      {saved.signature ? <Image source={{ uri: saved.signature }} style={{ width: '100%', height: 120 }} resizeMode="contain" /> : null}
      <TouchableOpacity onPress={() => router.replace({ pathname: '/(buyer)/delivery/[id]', params: { id: saved.deliveryId } })}>
        <Text>{t('deliveryFlow.openDelivery')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('handover.completing')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('handover.qualityTitle')}</Text>
      </View>
      <View style={styles.body}>
        <StepIndicator
          currentStep={step}
          totalSteps={3}
          labels={[t('handover.stepScan'), t('handover.stepAudit'), t('handover.stepSign')]}
        />
        <Text style={styles.blockTitle}>{t('handover.photosBlockTitle')}</Text>
        <Text style={styles.blockIntro}>{t('handover.photosBlockIntro')}</Text>
        <FormHelperText style={{ marginTop: 0 }}>{t('form.helper.handoverPhotos')}</FormHelperText>
        {SLOT_KEYS.map((key, index) => (
          <View key={key} style={{ marginTop: 16 }}>
            <Text style={styles.label}>{t(`handover.${key}Label`)} *</Text>
            <Text style={styles.hint}>{t(`handover.${key}Hint`)}</Text>
            <TouchableOpacity
              onPress={() => takePhoto(index)}
              disabled={picking}
              style={[styles.slot, farmerFormUi.touchTarget]}
              activeOpacity={0.8}
            >
              {photos[index] ? (
                <Image source={{ uri: photos[index]! }} style={styles.thumb} />
              ) : (
                <View style={styles.emptySlot}>
                  {picking ? <ActivityIndicator color={theme.colors.primary} /> : <ImageIcon size={32} color={theme.colors.text.tertiary} />}
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => takePhoto(index)} style={[styles.retake, farmerFormUi.touchTarget]} disabled={picking}>
              <Camera size={16} color={theme.colors.primary} />
              <Text style={styles.retakeText}>
                {photos[index] ? t('handover.replaceSlot') : t('handover.takeForSlot', { n: index + 1 })}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ marginTop: 28 }}>
          <Text style={styles.label}>{t('handover.visualCheck')}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              onPress={() => setVisualCheck('FRESH')}
              style={[
                styles.pill,
                { borderColor: visualCheck === 'FRESH' ? theme.colors.primary : theme.colors.border },
                visualCheck === 'FRESH' && { backgroundColor: `${theme.colors.primary}10` },
              ]}
            >
              <CheckCircle2 size={24} color={visualCheck === 'FRESH' ? theme.colors.primary : theme.colors.text.secondary} />
              <Text style={[styles.pillText, visualCheck === 'FRESH' && { color: theme.colors.primary }]}>{t('handover.fresh')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                clearPad();
                setVisualCheck('DAMAGED');
              }}
              style={[
                styles.pill,
                { borderColor: visualCheck === 'DAMAGED' ? theme.colors.error : theme.colors.border },
                visualCheck === 'DAMAGED' && { backgroundColor: `${theme.colors.error}10` },
              ]}
            >
              <XCircle size={24} color={visualCheck === 'DAMAGED' ? theme.colors.error : theme.colors.text.secondary} />
              <Text style={[styles.pillText, visualCheck === 'DAMAGED' && { color: theme.colors.error }]}>{t('handover.damaged')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={styles.label}>{t('handover.tempCheck')}</Text>
          <View style={styles.tempRow}>
            <Thermometer size={20} color={theme.colors.text.secondary} />
            <TextInput
              value={temperature}
              onChangeText={setTemperature}
              placeholder={t('handover.tempPlaceholder')}
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text style={styles.celsius}>°C</Text>
          </View>
          <FormHelperText>{t('form.helper.handoverTemperature')}</FormHelperText>
        </View>

        {visualCheck === 'FRESH' && (
          <View style={{ marginTop: 24 }}>
            <View style={styles.padHeader}>
              <Text style={styles.label}>{t('handover.signatureLabel')} *</Text>
              <TouchableOpacity onPress={clearPad} hitSlop={8}>
                <Text style={styles.clearText}>{t('handover.signatureClear')}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>{t('handover.signatureHint')}</Text>
            <FormHelperText style={{ marginTop: 0 }}>{t('form.helper.handoverSignature')}</FormHelperText>
            <View style={styles.shotWrap} collapsable={false}>
              <ViewShot ref={viewShotRef} options={viewShotOptions} style={styles.shotInner}>
                <View style={styles.padTouch} collapsable={false} {...panResponder.panHandlers}>
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
          </View>
        )}

        <View style={{ marginTop: 24 }}>
          <Text style={styles.label}>{t('handover.notes')}</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t('handover.notesPlaceholder')}
            multiline
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
          />
        </View>

        <TouchableOpacity onPress={handleComplete} style={styles.cta} activeOpacity={0.8}>
          <Text style={styles.ctaText}>{t('handover.completeCta')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 13, color: theme.colors.text.secondary, fontWeight: '400' },
  header: { padding: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  title: { fontSize: 16, fontWeight: '400', color: theme.colors.text.primary, letterSpacing: 0.5 },
  body: { padding: 16, paddingBottom: 48 },
  blockTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginTop: 8 },
  blockIntro: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20, marginTop: 6 },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 8 },
  hint: { fontSize: 14, color: theme.colors.text.tertiary, lineHeight: 18, marginBottom: 8 },
  slot: { borderRadius: theme.borderRadius.md, borderWidth: 2, borderStyle: 'dashed', borderColor: theme.colors.border, minHeight: 200, overflow: 'hidden' },
  emptySlot: { flex: 1, minHeight: 200, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface },
  thumb: { width: '100%', height: 200, resizeMode: 'cover' },
  retake: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, alignSelf: 'flex-start' },
  retakeText: { fontSize: 14, color: theme.colors.primary, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  pill: { flex: 1, minHeight: 48, padding: 16, borderRadius: 8, borderWidth: 0.5, alignItems: 'center', justifyContent: 'center' },
  pillText: { marginTop: 8, fontSize: 14, fontWeight: '400' },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: { flex: 1, minHeight: 48, padding: 12, fontSize: 16, color: theme.colors.text.primary, fontWeight: '400' },
  celsius: { fontSize: 14, color: theme.colors.text.secondary, marginRight: 8 },
  cta: { marginTop: 32, backgroundColor: theme.colors.primary, minHeight: 48, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 14, fontWeight: '600', color: theme.colors.background },
  padHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  clearText: { fontSize: 14, color: theme.colors.primary, fontWeight: '500' },
  shotWrap: {
    marginTop: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  shotInner: { width: SIG_W, height: SIG_H, backgroundColor: '#fff' },
  padTouch: { width: SIG_W, height: SIG_H },
});
