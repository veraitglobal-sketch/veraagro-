import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X, Camera } from 'lucide-react-native';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { BioVeraBottomSheet } from '../../../components/enterprise/BioVeraBottomSheet';
import {
  EnterpriseButton,
  EnterpriseTextField,
  EnterpriseTextArea,
  EnterprisePanel,
} from '../../../design-system';
import { GROWTH_STAGE_PRESET_KEYS, type GrowthStagePresetKey } from './GrowthJournalFilters';

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
    growthStage === '__custom__'
      ? customStage.trim() || undefined
      : growthStage && GROWTH_STAGE_PRESET_KEYS.includes(growthStage as GrowthStagePresetKey)
        ? t(`producer.growthJournal.stagePreset.${growthStage}`)
        : growthStage || undefined;

  const submit = async () => {
    await onSubmit({ notes: notes.trim(), growthStage: stageToSave });
  };

  return (
    <BioVeraBottomSheet visible={visible} onClose={onClose} keyboardAvoiding>
        <View style={{ paddingBottom: Math.max(p.bottomInset, 8) }}>
          <View style={[styles.sheetHeader, { paddingHorizontal: p.screenPaddingLeft }]}>
            <Text style={styles.sheetTitle}>{t('producer.growthJournal.addLogTitle')}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
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
              {GROWTH_STAGE_PRESET_KEYS.map((key) => {
                const sel = growthStage === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      setGrowthStage(sel ? '' : key);
                      setCustomStage('');
                    }}
                    style={[styles.chip, sel && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                      {t(`producer.growthJournal.stagePreset.${key}`)}
                    </Text>
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
              <EnterpriseTextField
                value={customStage}
                onChangeText={setCustomStage}
                placeholder={t('producer.growthJournal.customStagePlaceholder')}
              />
            ) : null}

            <EnterpriseTextArea
              label={t(
                strictPlantingProgress
                  ? 'producer.growthJournal.notesLabelPlanting'
                  : 'producer.growthJournal.notesLabel',
              )}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('producer.growthJournal.notesPlaceholder')}
              minRows={3}
            />

            <EnterprisePanel variant="tint" style={styles.photoHint}>
              <Text style={enterpriseUi.navRowTitle}>
                {t('producer.growthJournal.photoRequiredLineTitle')}
              </Text>
              <Text style={[enterpriseUi.navRowSubtitle, { marginTop: 6 }]}>
                {t('producer.growthJournal.photoRequiredLineBody')}
              </Text>
            </EnterprisePanel>

            <EnterpriseButton
              label={t('producer.growthJournal.continueCta')}
              onPress={() => void submit()}
              loading={busy}
              disabled={busy}
              fullWidth
              size="large"
              icon={<Camera size={20} color={enterpriseColors.white} strokeWidth={1.5} />}
            />
            <Text style={styles.footerNote}>{t('producer.growthJournal.addLogFooter')}</Text>
          </ScrollView>
        </View>
    </BioVeraBottomSheet>
  );
}

const styles = StyleSheet.create({
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
  photoHint: {
    marginBottom: 14,
  },
  footerNote: {
    fontSize: 14,
    lineHeight: 17,
    color: enterpriseColors.gray600,
    marginTop: 10,
  },
});
