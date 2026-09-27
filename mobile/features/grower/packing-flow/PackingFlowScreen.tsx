/**
 * Packing Flow – Step-by-step wizard
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkflowBatchSelection } from '../../../hooks/useWorkflowBatchSelection';
import { EnterpriseButton } from '../../../design-system/EnterpriseButton';
import { BatchWorkflowActions } from '../batches/BatchWorkflowActions';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Package } from 'lucide-react-native';
import { EnterpriseNavSection } from '../../../design-system/EnterpriseNavSection';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { EnterpriseNotice } from '../../../components/enterprise/EnterpriseNotice';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import StepInstructions from './StepInstructions';
import { WorkflowSteps } from '../../../components/grower/WorkflowSteps';
import StepCamera from './StepCamera';
import StepGps, { type GpsCapturePayload } from './StepGps';
import { batchesAPI } from '../../../lib/api';

const STEPS = [
  { id: 'instructions', titleKey: 'workflowSteps.instructions' },
  { id: 'camera', titleKey: 'workflowSteps.photos' },
  { id: 'gps', titleKey: 'workflowSteps.location' },
] as const;

type PackingBatch = { id: string; batchId?: string; productName?: string };

export default function PackingFlowScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [batches, setBatches] = useState<PackingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { selectedBatch, setSelectedBatchId, missingRequestedBatch } = useWorkflowBatchSelection(batches, false);
  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const data = await batchesAPI.getAll();
      setBatches(data.filter((row: PackingBatch) => row?.id));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (selectedBatch && !loading && !failed) {
    return <PackingWizard key={selectedBatch.id} batchRef={selectedBatch.id}
      batchLabel={[selectedBatch.batchId, selectedBatch.productName].filter(Boolean).join(' · ')} />;
  }
  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader title={t('packingFlow.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={[growerUi.scrollContent, { gap: 12 }]}>
        <Text style={[enterpriseUi.inAppSectionLabel, { marginTop: 4 }]}>{t('batchWorkflow.selectBatch')}</Text>
        {loading ? <ActivityIndicator color={enterpriseColors.primary} /> : failed ? (
          <>
            <Text style={enterpriseUi.navRowSubtitle}>{t('batchWorkflow.loadFailed')}</Text>
            <EnterpriseButton label={t('common.tryAgain')} onPress={() => void load()} />
          </>
        ) : (
          <>
            {missingRequestedBatch ? <EnterpriseNotice title={t('batchWorkflow.unavailable')} /> : null}
            <EnterpriseNavSection
              items={batches.map((batch) => ({
                key: batch.id,
                title: batch.productName || batch.batchId || batch.id,
                subtitle: batch.batchId || undefined,
                icon: Package,
                tone: 'green' as const,
                onPress: () => setSelectedBatchId(batch.id),
              }))}
            />
            {batches.length === 0 ? (
              <>
                <Text style={enterpriseUi.navRowSubtitle}>{t('producer.batches.noBatches')}</Text>
                <EnterpriseButton label={t('producer.batches.createFabA11y')}
                  onPress={() => router.push('/(producer)/batch-new')} />
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function PackingWizard({ batchRef, batchLabel }: { batchRef: string; batchLabel: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [instructionsViewed, setInstructionsViewed] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [qualityPhotoUri, setQualityPhotoUri] = useState<string | null>(null);
  const [gpsCaptured, setGpsCaptured] = useState(false);
  const [gpsPayload, setGpsPayload] = useState<GpsCapturePayload | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [flowComplete, setFlowComplete] = useState(false);
  const [successPhotosSaved, setSuccessPhotosSaved] = useState(false);

  const submittingRef = useRef(false);

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
    if (submittingRef.current) return;
    if (!batchRef) {
      Alert.alert(t('alerts.warning'), t('packingFlow.needBatch'), [{ text: t('common.ok') }]);
      setSubmitting(false);
      return;
    }
    if (!gpsPayload) {
      setSubmitting(false);
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
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
      if (!res.success) throw new Error(t('packingFlow.submitFailed'));
      setSuccessPhotosSaved(!!res.photosSaved);
      setFlowComplete(true);
    } catch (err: unknown) {
      console.error('Submit packing record:', err);
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : '';
      Alert.alert(t('error'), msg || t('packingFlow.submitFailed'), [{ text: t('common.ok') }]);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const footerPadding = {
    paddingBottom: Math.max(insets.bottom, 12) + 12,
    paddingHorizontal: 20,
  };

  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader title={t('packingFlow.title')} subtitle={batchLabel} onBack={handleBack} />

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
            <BatchWorkflowActions batchId={batchRef} steps={['labels', 'quality', 'detail']} />
          </ScrollView>
          <View style={[styles.footer, footerPadding]}>
            <TouchableOpacity style={enterpriseUi.authBtnPrimary} onPress={handleBack} activeOpacity={0.88}>
              <Text style={enterpriseUi.authBtnPrimaryText}>{t('packingFlow.finishButton')}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.stepsWrap}>
            <WorkflowSteps current={step} labels={STEPS.map(s => t(s.titleKey))} />
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.contentInner}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {currentStepId === 'instructions' ? (
              <StepInstructions viewed={instructionsViewed} onToggle={() => setInstructionsViewed(value => !value)} />
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
  stepsWrap: { paddingHorizontal: 20 },
  contentInner: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.canvas,
  },
  nextBtn: {
    minHeight: 48,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
});
