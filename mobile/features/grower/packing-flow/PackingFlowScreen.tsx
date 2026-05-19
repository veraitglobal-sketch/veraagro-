/**
 * Packing Flow – Step-by-step wizard
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, Camera, MapPin, Check } from 'lucide-react-native';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { EnterpriseNotice } from '../../../components/enterprise/EnterpriseNotice';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import StepInstructions from './StepInstructions';
import StepCamera from './StepCamera';
import StepGps, { type GpsCapturePayload } from './StepGps';
import { batchesAPI } from '../../../lib/api';

const STEPS = [
  { id: 'instructions', icon: FileText, titleKey: 'packingFlow.step1.title' },
  { id: 'camera', icon: Camera, titleKey: 'packingFlow.step2.title' },
  { id: 'gps', icon: MapPin, titleKey: 'packingFlow.step3.title' },
] as const;

export default function PackingFlowScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      void handleSubmit();
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

  const handleSubmit = async () => {
    setSubmitting(true);
    if (!batchRef) {
      Alert.alert(t('alerts.warning'), t('packingFlow.needBatch'), [{ text: t('common.ok') }]);
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
    paddingBottom: Math.max(insets.bottom, 12) + 12,
    paddingHorizontal: 20,
  };

  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader title={t('packingFlow.title')} onBack={handleBack} />

      {!flowComplete && !batchRef ? (
        <View style={styles.noticeWrap}>
          <EnterpriseNotice title={t('packingFlow.needBatchBanner')} />
        </View>
      ) : null}

      {flowComplete ? (
        <>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[growerUi.scrollContent, styles.successScroll]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.successIconWrap}>
              <Check size={40} color={enterpriseColors.white} strokeWidth={2.5} />
            </View>
            <Text style={growerUi.pageTitle}>{t('packingFlow.successTitle')}</Text>
            <Text style={[growerUi.pageLead, styles.successBody]}>
              {successPhotosSaved ? t('packingFlow.successBodyWithPhotos') : t('packingFlow.successBodyLocationOnly')}
            </Text>
            <Text style={enterpriseUi.navRowSubtitle}>{t('packingFlow.successHint')}</Text>
          </ScrollView>
          <View style={[styles.footer, footerPadding]}>
            <TouchableOpacity style={enterpriseUi.authBtnPrimary} onPress={handleBack} activeOpacity={0.88}>
              <Text style={enterpriseUi.authBtnPrimaryText}>{t('packingFlow.finishButton')}</Text>
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
                  <View
                    style={[
                      styles.stepDot,
                      done && styles.stepDotDone,
                      active && !done && styles.stepDotActive,
                    ]}
                  >
                    {done ? (
                      <Check size={16} color={enterpriseColors.white} strokeWidth={2} />
                    ) : (
                      <Icon
                        size={16}
                        color={active ? enterpriseColors.primary : enterpriseColors.gray600}
                        strokeWidth={1.5}
                      />
                    )}
                  </View>
                  {i < STEPS.length - 1 ? (
                    <View style={[styles.stepLine, i < step && styles.stepLineDone]} />
                  ) : null}
                </View>
              );
            })}
          </View>
          <Text style={styles.stepLabel}>{t(STEPS[step].titleKey)}</Text>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.contentInner}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {currentStepId === 'instructions' ? (
              <StepInstructions onViewed={() => setInstructionsViewed(true)} />
            ) : null}
            {currentStepId === 'camera' ? (
              <StepCamera
                photoUri={photoUri}
                qualityPhotoUri={qualityPhotoUri}
                onPhotoTaken={setPhotoUri}
                onQualityPhotoTaken={setQualityPhotoUri}
              />
            ) : null}
            {currentStepId === 'gps' ? (
              <StepGps
                onCaptured={(capture) => {
                  setGpsPayload(capture);
                  setGpsCaptured(true);
                }}
              />
            ) : null}
          </ScrollView>

          <View style={[styles.footer, footerPadding]}>
            <TouchableOpacity
              style={[enterpriseUi.authBtnPrimary, styles.nextBtn, (!canProceed || submitting) && styles.nextBtnDisabled]}
              onPress={handleNext}
              disabled={!canProceed || submitting}
              activeOpacity={0.88}
            >
              {submitting ? (
                <ActivityIndicator color={enterpriseColors.white} size="small" />
              ) : (
                <Text style={enterpriseUi.authBtnPrimaryText}>
                  {step < STEPS.length - 1 ? t('common.next') : t('packingFlow.submit')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  noticeWrap: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  successScroll: {
    alignItems: 'center',
    paddingTop: 24,
  },
  successIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: enterpriseColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successBody: {
    textAlign: 'center',
    marginBottom: 12,
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: enterpriseColors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
  },
  stepDotWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: enterpriseColors.white,
    borderWidth: 2,
    borderColor: enterpriseColors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: enterpriseColors.primary,
    borderColor: enterpriseColors.primary,
  },
  stepDotActive: {
    borderColor: enterpriseColors.primary,
    backgroundColor: enterpriseColors.primaryTint,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: enterpriseColors.gray200,
    marginHorizontal: 4,
  },
  stepLineDone: {
    backgroundColor: enterpriseColors.primary,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    textAlign: 'center',
    marginVertical: 12,
    paddingHorizontal: 20,
  },
  contentInner: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  },
  nextBtn: {
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
});
