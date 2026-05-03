/**
 * Packing Flow – Step-by-step wizard
 * Step 1: Manual (Packaging instructions)
 * Step 2: Camera (Photo crates + Final quality check – top layer, no mold/foreign bodies)
 * Step 3: GPS/Timestamp (Automatic log)
 * + Batch Sticker Scan: Bio Vera QR on pallet (farmer confirms they packed it)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Camera,
  MapPin,
  ChevronRight,
  Check,
  ArrowLeft,
} from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import StepInstructions from './StepInstructions';
import StepCamera from './StepCamera';
import StepGps, { type GpsCapturePayload } from './StepGps';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { batchesAPI } from '../../../lib/api';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';

const STEPS = [
  { id: 'instructions', icon: FileText, titleKey: 'packingFlow.step1.title' },
  { id: 'camera', icon: Camera, titleKey: 'packingFlow.step2.title' },
  { id: 'gps', icon: MapPin, titleKey: 'packingFlow.step3.title' },
];

export default function PackingFlowScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const params = useLocalSearchParams<{ batchId?: string }>();
  const [step, setStep] = useState(0);
  const [instructionsViewed, setInstructionsViewed] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [qualityPhotoUri, setQualityPhotoUri] = useState<string | null>(null);
  const [gpsCaptured, setGpsCaptured] = useState(false);
  const [gpsPayload, setGpsPayload] = useState<GpsCapturePayload | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [flowComplete, setFlowComplete] = useState(false);
  const [successPhotosSaved, setSuccessPhotosSaved] = useState(false);

  const batchRef = params.batchId ? String(params.batchId) : '';

  const currentStepId = STEPS[step]?.id ?? 'instructions';
  const canProceed = (() => {
    if (step === 0) return instructionsViewed;
    if (step === 1) return !!photoUri && !!qualityPhotoUri;
    if (step === 2) return gpsCaptured && !!gpsPayload && !!batchRef;
    return false;
  })();

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (flowComplete) {
      router.back();
      return;
    }
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  };

  const finishAndLeave = () => {
    router.back();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    if (!batchRef) {
      Alert.alert(
        t('alerts.warning'),
        t('packingFlow.needBatch'),
        [{ text: t('common.ok') }],
      );
      setSubmitting(false);
      return;
    }
    if (!gpsPayload) {
      setSubmitting(false);
      return;
    }
    try {
      let cratePhotoBase64: string | undefined;
      let qualityPhotoBase64: string | undefined;
      if (photoUri && qualityPhotoUri) {
        const c = await readAsStringAsync(photoUri, { encoding: EncodingType.Base64 });
        const q = await readAsStringAsync(qualityPhotoUri, { encoding: EncodingType.Base64 });
        cratePhotoBase64 = `data:image/jpeg;base64,${c}`;
        qualityPhotoBase64 = `data:image/jpeg;base64,${q}`;
      }
      const res = await batchesAPI.recordPackingFlow(batchRef, {
        latitude: gpsPayload.lat,
        longitude: gpsPayload.lng,
        completedAt: gpsPayload.timestamp,
        cratePhotoBase64,
        qualityPhotoBase64,
      });
      setSuccessPhotosSaved(!!res.photosSaved);
      setFlowComplete(true);
    } catch (err: unknown) {
      console.error('Submit packing record:', err);
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : '';
      Alert.alert(t('error'), msg || t('packingFlow.submitFailed'), [{ text: t('common.ok') }]);
    } finally {
      setSubmitting(false);
    }
  };

  const footerPadding = {
    paddingBottom: p.bottomInset + theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingLeft: Math.max(theme.spacing.md, p.screenPaddingLeft),
    paddingRight: Math.max(theme.spacing.md, p.screenPaddingRight),
  };

  return (
    <View style={styles.container}>
      {/* Header — same top inset as BioVeraSubpageHeader (notch/status bar safe) */}
      <View
        style={[
          styles.header,
          {
            paddingTop: p.headerTop,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
          },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('packingFlow.title')}</Text>
      </View>

      {!flowComplete && !batchRef ? (
        <View style={styles.needBatchRibbon}>
          <Text style={styles.needBatchRibbonText}>{t('packingFlow.needBatchBanner')}</Text>
        </View>
      ) : null}

      {flowComplete ? (
        <>
          <ScrollView
            style={styles.content}
            contentContainerStyle={[styles.contentInner, styles.successScroll]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.successIconWrap}>
              <Check size={40} color="#fff" strokeWidth={2.5} />
            </View>
            <Text style={styles.successTitle}>{t('packingFlow.successTitle')}</Text>
            <Text style={styles.successBody}>
              {successPhotosSaved ? t('packingFlow.successBodyWithPhotos') : t('packingFlow.successBodyLocationOnly')}
            </Text>
            <Text style={styles.successHint}>{t('packingFlow.successHint')}</Text>
          </ScrollView>
          <View style={[styles.footer, footerPadding]}>
            <TouchableOpacity style={styles.nextBtn} onPress={finishAndLeave} activeOpacity={0.85}>
              <Text style={styles.nextBtnText}>{t('packingFlow.finishButton')}</Text>
              <ChevronRight size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.stepper}>
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < step || (i === step && canProceed);
              const active = i === step;
              return (
                <View key={s.id} style={styles.stepDotWrap}>
                  <View style={[styles.stepDot, done && styles.stepDotDone, active && styles.stepDotActive]}>
                    {done ? (
                      <Check size={16} color="#fff" strokeWidth={2} />
                    ) : (
                      <Icon size={16} color={active ? theme.colors.primary : theme.colors.text.tertiary} />
                    )}
                  </View>
                  {i < STEPS.length - 1 && (
                    <View style={[styles.stepLine, i < step && styles.stepLineDone]} />
                  )}
                </View>
              );
            })}
          </View>
          <Text style={styles.stepLabel}>{t(STEPS[step].titleKey)}</Text>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentInner}
            keyboardShouldPersistTaps="handled"
          >
            {currentStepId === 'instructions' && (
              <StepInstructions onViewed={() => setInstructionsViewed(true)} />
            )}
            {currentStepId === 'camera' && (
              <StepCamera
                photoUri={photoUri}
                qualityPhotoUri={qualityPhotoUri}
                onPhotoTaken={setPhotoUri}
                onQualityPhotoTaken={setQualityPhotoUri}
              />
            )}
            {currentStepId === 'gps' && (
              <StepGps
                onCaptured={(capture) => {
                  setGpsPayload(capture);
                  setGpsCaptured(true);
                }}
              />
            )}
          </ScrollView>

          <View style={[styles.footer, footerPadding]}>
            <TouchableOpacity
              style={[styles.nextBtn, (!canProceed || submitting) && styles.nextBtnDisabled]}
              onPress={handleNext}
              disabled={!canProceed || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.nextBtnText}>
                    {step < STEPS.length - 1 ? t('common.next') : t('packingFlow.submit')}
                  </Text>
                  <ChevronRight size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  needBatchRibbon: {
    backgroundColor: `${theme.colors.warning}24`,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  needBatchRibbonText: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.text.primary,
    lineHeight: 20,
    textAlign: 'center',
  },
  successScroll: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
  },
  successIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  successTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  successBody: {
    fontSize: 16,
    fontWeight: '300',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  successHint: {
    fontSize: 14,
    fontWeight: '300',
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: theme.spacing.sm,
  },
  backBtn: { padding: theme.spacing.sm, marginRight: theme.spacing.sm },
  headerTitle: { ...theme.typography.h3, color: theme.colors.text.primary },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  stepDotWrap: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
  stepDotActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: 4,
  },
  stepLineDone: { backgroundColor: theme.colors.success },
  stepLabel: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  content: { flex: 1 },
  contentInner: { padding: theme.spacing.md, paddingBottom: theme.spacing['2xl'] },
  footer: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    minHeight: 56,
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { fontSize: 18, fontWeight: '600', color: '#fff' },
});
