import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Thermometer, Image as ImageIcon, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { colors } from '../../lib/colors';
import { theme } from '../../lib/theme';
import { digitalHandoverAPI } from '../../lib/api';
import StepIndicator from '../../components/StepIndicator';

const PHOTO_COUNT = 4;
const SLOT_KEYS = ['slot0', 'slot1', 'slot2', 'slot3'] as const;

/**
 * Manager / store handover: visual check, temperature, four documented photos, then submit.
 * Backend still accepts 2+ URLs; we always send 4 for full traceability.
 */
export default function HandoverCompleteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { handoverId } = useLocalSearchParams<{ handoverId: string }>();
  const [step, setStep] = useState(2);
  const [visualCheck, setVisualCheck] = useState<'FRESH' | 'DAMAGED' | null>(null);
  const [temperature, setTemperature] = useState('');
  const [photos, setPhotos] = useState<(string | null)[]>(() => Array(PHOTO_COUNT).fill(null));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState(false);

  const takePhoto = useCallback(
    async (index: number) => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('error'), t('handover.permCamera', { defaultValue: 'Camera permission is required' }));
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
    if (!visualCheck) {
      Alert.alert(t('error'), t('handover.errVisual'));
      return;
    }
    if (!temperature || Number.isNaN(parseFloat(temperature))) {
      Alert.alert(t('error'), t('handover.errTemp'));
      return;
    }
    if (photos.some((p) => !p)) {
      Alert.alert(t('error'), t('handover.errPhotos'));
      return;
    }
    if (!handoverId) {
      Alert.alert(t('error'), t('handover.errHandoverId'));
      return;
    }
    setLoading(true);
    try {
      const photoUrls = photos.filter((p): p is string => p != null);
      await digitalHandoverAPI.complete({
        handoverId,
        qualityCheck: {
          visualCheck,
          temperature: parseFloat(temperature),
          photoUrls,
          notes: notes || undefined,
        },
      });
      Alert.alert(
        t('handover.completeTitle'),
        visualCheck === 'DAMAGED' ? t('handover.doneDamaged') : t('handover.doneOk'),
        [{ text: t('common.ok'), onPress: () => router.back() }],
      );
    } catch (error: any) {
      Alert.alert(t('error'), error?.response?.data?.message || t('handover.errGeneric'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
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
        {SLOT_KEYS.map((key, index) => (
          <View key={key} style={{ marginTop: 16 }}>
            <Text style={styles.label}>{t(`handover.${key}Label`)} *</Text>
            <Text style={styles.hint}>{t(`handover.${key}Hint`)}</Text>
            <TouchableOpacity
              onPress={() => takePhoto(index)}
              disabled={picking}
              style={styles.slot}
              activeOpacity={0.8}
            >
              {photos[index] ? (
                <Image source={{ uri: photos[index]! }} style={styles.thumb} />
              ) : (
                <View style={styles.emptySlot}>
                  {picking ? <ActivityIndicator color={colors.primary} /> : <ImageIcon size={32} color={colors.text.tertiary} />}
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => takePhoto(index)} style={styles.retake} disabled={picking}>
              <Camera size={16} color={colors.primary} />
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
                { borderColor: visualCheck === 'FRESH' ? colors.primary : colors.border },
                visualCheck === 'FRESH' && { backgroundColor: `${colors.primary}10` },
              ]}
            >
              <CheckCircle2 size={24} color={visualCheck === 'FRESH' ? colors.primary : colors.text.secondary} />
              <Text style={[styles.pillText, visualCheck === 'FRESH' && { color: colors.primary }]}>{t('handover.fresh')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setVisualCheck('DAMAGED')}
              style={[
                styles.pill,
                { borderColor: visualCheck === 'DAMAGED' ? colors.error : colors.border },
                visualCheck === 'DAMAGED' && { backgroundColor: `${colors.error}10` },
              ]}
            >
              <XCircle size={24} color={visualCheck === 'DAMAGED' ? colors.error : colors.text.secondary} />
              <Text style={[styles.pillText, visualCheck === 'DAMAGED' && { color: colors.error }]}>{t('handover.damaged')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={styles.label}>{t('handover.tempCheck')}</Text>
          <View style={styles.tempRow}>
            <Thermometer size={20} color={colors.text.secondary} />
            <TextInput
              value={temperature}
              onChangeText={setTemperature}
              placeholder={t('handover.tempPlaceholder')}
              placeholderTextColor={colors.text.tertiary}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text style={styles.celsius}>°C</Text>
          </View>
        </View>

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
  root: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 13, color: colors.text.secondary, fontWeight: '300' },
  header: { padding: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  title: { fontSize: 16, fontWeight: '300', color: colors.text.primary, letterSpacing: 0.5 },
  body: { padding: 20, paddingBottom: 48 },
  blockTitle: { fontSize: 16, fontWeight: '600', color: colors.text.primary, marginTop: 8 },
  blockIntro: { fontSize: 13, color: colors.text.secondary, lineHeight: 20, marginTop: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text.primary, marginBottom: 8 },
  hint: { fontSize: 12, color: colors.text.tertiary, lineHeight: 18, marginBottom: 8 },
  slot: { borderRadius: theme.borderRadius.md, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, minHeight: 200, overflow: 'hidden' },
  emptySlot: { flex: 1, minHeight: 200, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  thumb: { width: '100%', height: 200, resizeMode: 'cover' },
  retake: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, alignSelf: 'flex-start' },
  retakeText: { fontSize: 12, color: colors.primary, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  pill: { flex: 1, padding: 16, borderRadius: 8, borderWidth: 0.5, alignItems: 'center' },
  pillText: { marginTop: 8, fontSize: 12, fontWeight: '300' },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: { flex: 1, padding: 12, fontSize: 14, color: colors.text.primary, fontWeight: '300' },
  celsius: { fontSize: 13, color: colors.text.secondary, marginRight: 8 },
  cta: { marginTop: 32, backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  ctaText: { fontSize: 14, fontWeight: '600', color: colors.background },
});
