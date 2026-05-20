import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X, Camera } from 'lucide-react-native';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';

export const GROWTH_STAGE_PRESETS = [
  'Vegetative',
  'Flowering',
  'Fruit set',
  'Ripening',
  'Pre-harvest',
] as const;

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: { notes: string; growthStage: string | undefined }) => Promise<void>;
  busy: boolean;
  parcelLabel?: string;
  planLabel?: string;
  strictPlantingProgress?: boolean;
};

export function AddGrowthLogModal({
  visible,
  onClose,
  onSubmit,
  busy,
  parcelLabel,
  planLabel,
  strictPlantingProgress = false,
}: Props) {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  const [notes, setNotes] = useState('');
  const [growthStage, setGrowthStage] = useState<string>('');
  const [customStage, setCustomStage] = useState('');

  useEffect(() => {
    if (!visible) {
      setNotes('');
      setGrowthStage('');
      setCustomStage('');
    }
  }, [visible]);

  const stageToSave =
    growthStage === '__custom__' ? customStage.trim() || undefined : growthStage || undefined;

  const submit = async () => {
    await onSubmit({ notes: notes.trim(), growthStage: stageToSave });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(p.bottomInset, 16) },
          ]}
        >
          <View style={[styles.sheetHeader, { paddingHorizontal: p.screenPaddingLeft }]}>
            <Text style={styles.sheetTitle}>{t('producer.growthJournal.addLogTitle')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityRole="button">
              <X size={22} color={enterpriseColors.gray600} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: p.screenPaddingLeft, paddingBottom: 20 }}
          >
            <Text style={enterpriseUi.navRowSubtitle}>
              {t('producer.growthJournal.addLogContext', {
                parcel: parcelLabel || '—',
                planting: planLabel || '—',
              })}
            </Text>
            <Text style={styles.passportLine}>{t('producer.growthJournal.passportLinkedLine')}</Text>

            <Text style={enterpriseUi.inAppSectionLabel}>
              {t(
                strictPlantingProgress
                  ? 'producer.growthJournal.growthStageLabelPlanting'
                  : 'producer.growthJournal.growthStageLabel',
              )}
            </Text>
            <View style={styles.chipRow}>
              {GROWTH_STAGE_PRESETS.map((s) => {
                const sel = growthStage === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => {
                      setGrowthStage(sel ? '' : s);
                      setCustomStage('');
                    }}
                    style={[styles.chip, sel && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, sel && styles.chipTextSelected]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => setGrowthStage((prev) => (prev === '__custom__' ? '' : '__custom__'))}
                style={[styles.chip, growthStage === '__custom__' && styles.chipSelected]}
              >
                <Text
                  style={[styles.chipText, growthStage === '__custom__' && styles.chipTextSelected]}
                >
                  {t('producer.growthJournal.customStage')}
                </Text>
              </TouchableOpacity>
            </View>
            {growthStage === '__custom__' ? (
              <TextInput
                value={customStage}
                onChangeText={setCustomStage}
                placeholder={t('producer.growthJournal.customStagePlaceholder')}
                placeholderTextColor={enterpriseColors.gray600}
                style={[growerUi.formInput, styles.fieldGap]}
              />
            ) : null}

            <Text style={enterpriseUi.inAppSectionLabel}>
              {t(
                strictPlantingProgress
                  ? 'producer.growthJournal.notesLabelPlanting'
                  : 'producer.growthJournal.notesLabel',
              )}
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={t('producer.growthJournal.notesPlaceholder')}
              placeholderTextColor={enterpriseColors.gray600}
              multiline
              numberOfLines={3}
              style={[growerUi.formInput, styles.notesInput]}
            />

            <View style={styles.photoHint}>
              <Text style={enterpriseUi.navRowTitle}>
                {t('producer.growthJournal.photoRequiredLineTitle')}
              </Text>
              <Text style={[enterpriseUi.navRowSubtitle, { marginTop: 6 }]}>
                {t('producer.growthJournal.photoRequiredLineBody')}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => void submit()}
              disabled={busy}
              activeOpacity={0.88}
              style={[enterpriseUi.authBtnPrimary, styles.submitBtn, busy && styles.submitBusy]}
            >
              {busy ? (
                <ActivityIndicator color={enterpriseColors.white} />
              ) : (
                <>
                  <Camera size={20} color={enterpriseColors.white} strokeWidth={1.5} />
                  <Text style={enterpriseUi.authBtnPrimaryText}>
                    {t('producer.growthJournal.continueCta')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.footerNote}>{t('producer.growthJournal.addLogFooter')}</Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: enterpriseColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '88%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 10,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: enterpriseColors.gray900,
  },
  passportLine: {
    fontSize: 13,
    lineHeight: 18,
    color: enterpriseColors.primary,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
  },
  chipSelected: {
    borderColor: enterpriseColors.primary,
    backgroundColor: enterpriseColors.primaryTint,
  },
  chipText: {
    fontSize: 13,
    color: enterpriseColors.gray700,
  },
  chipTextSelected: {
    color: enterpriseColors.primary,
    fontWeight: '600',
  },
  fieldGap: {
    marginBottom: 12,
  },
  notesInput: {
    minHeight: 88,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  photoHint: {
    borderWidth: 1,
    borderColor: enterpriseColors.primaryTintStrong,
    backgroundColor: enterpriseColors.primaryTint,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
  },
  submitBusy: {
    opacity: 0.6,
  },
  footerNote: {
    fontSize: 12,
    lineHeight: 17,
    color: enterpriseColors.gray600,
    marginTop: 10,
  },
});
