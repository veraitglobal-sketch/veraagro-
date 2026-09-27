import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { BioVeraBottomSheet } from '../../../components/enterprise/BioVeraBottomSheet';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { GrowerSelectField } from '../../../components/grower/GrowerSelectField';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { EnterpriseButton, EnterpriseTextField, EnterpriseTextArea } from '../../../design-system';
import { CROP_CATALOG, cropTypeForLocale } from './crop-catalog';
import type { ParcelAug } from './usePlantingsData';

type Props = {
  visible: boolean;
  saving: boolean;
  parcels: ParcelAug[];
  presetParcelId?: string;
  formErr: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    parcelId: string;
    crop: string;
    date: string;
    notes: string;
  }) => void;
};

export function PlantingAddWizard({
  visible,
  saving,
  parcels,
  presetParcelId,
  formErr,
  onClose,
  onSubmit,
}: Props) {
  const { t, i18n } = useTranslation();
  const p = useBioVeraScreenPadding();
  const langSr = !!i18n.language?.startsWith('sr');
  const [step, setStep] = useState<1 | 2>(1);
  const [parcelId, setParcelId] = useState('');
  const [cropKey, setCropKey] = useState('');
  const [customCrop, setCustomCrop] = useState('');
  const [showOther, setShowOther] = useState(false);
  const [cropQuery, setCropQuery] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const allVarieties = useMemo(() => CROP_CATALOG.flatMap((c) => c.items), []);
  const filteredVarieties = useMemo(() => {
    const q = cropQuery.trim().toLowerCase();
    if (!q) return allVarieties;
    return allVarieties.filter((row) => {
      const sr = row.cropTypeSr.toLowerCase();
      const en = row.cropTypeEn.toLowerCase();
      return sr.includes(q) || en.includes(q);
    });
  }, [allVarieties, cropQuery]);

  const cropOptions = useMemo(
    () =>
      filteredVarieties.map((row) => ({
        id: `${row.cropTypeEn}|${row.cropTypeSr}`,
        label: cropTypeForLocale(row, langSr),
      })),
    [filteredVarieties, langSr],
  );

  const parcelOptions = useMemo(
    () => parcels.map((par) => ({ id: par.id, label: par.label })),
    [parcels],
  );

  const cropChosen = Boolean(cropKey || customCrop.trim());

  useEffect(() => {
    if (!visible) return;
    const pid = presetParcelId ?? (parcels.length === 1 ? parcels[0].id : '');
    setParcelId(pid);
    setStep(pid ? 2 : 1);
    setCropKey('');
    setCustomCrop('');
    setShowOther(false);
    setCropQuery('');
    setDate(new Date().toISOString().slice(0, 10));
    setNotes('');
  }, [visible, presetParcelId, parcels]);

  useEffect(() => {
    if (!visible) return;
    if (parcels.length === 1) setParcelId(parcels[0].id);
  }, [visible, parcels]);

  const cropLabel = (): string => {
    const custom = customCrop.trim();
    if (custom) return custom;
    const row = allVarieties.find((r) => `${r.cropTypeEn}|${r.cropTypeSr}` === cropKey);
    if (row) return cropTypeForLocale(row, langSr);
    return '';
  };

  return (
    <BioVeraBottomSheet visible={visible} onClose={onClose} keyboardAvoiding>
      <View style={[styles.sheet, { paddingHorizontal: p.screenPaddingLeft }]}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitles}>
              <Text style={styles.stepFraction}>
                {t('producer.fieldLogForm.farmerStepFraction', { step, total: 2 })}
              </Text>
              <Text style={styles.sheetTitle}>
                {step === 1
                  ? t('producer.plantings.wizardStepParcel')
                  : t('producer.plantings.wizardStepCrop')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityRole="button">
              <X size={24} color={enterpriseColors.gray600} />
            </TouchableOpacity>
          </View>

          {parcels.length === 0 ? (
            <Text style={styles.noParcels}>{t('producer.plantings.noParcelsHint')}</Text>
          ) : (
            <>
              <ScrollView
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 12 }}
              >
                {step === 1 ? (
                  <>
                    <Text style={styles.lead}>{t('producer.plantings.wizardParcelLead')}</Text>
                    <GrowerSelectField
                      label={t('producer.growthJournal.parcelLabel')}
                      placeholder={t('producer.select.parcel')}
                      valueId={parcelId}
                      options={parcelOptions}
                      onSelect={(id) => setParcelId(id)}
                    />
                  </>
                ) : (
                  <>
                    {parcels.length > 1 ? (
                      <TouchableOpacity onPress={() => setStep(1)} style={styles.changeLinkBtn}>
                        <Text style={styles.changeLink}>{t('producer.fieldLogForm.wizardBack')}</Text>
                      </TouchableOpacity>
                    ) : null}

                    <GrowerSelectField
                      label={t('producer.plantings.wizardStepCrop')}
                      placeholder={t('producer.select.crop')}
                      valueId={cropKey}
                      options={cropOptions}
                      onSelect={(id) => {
                        setCropKey(id);
                        setCustomCrop('');
                        setShowOther(false);
                      }}
                      listSearchPlaceholder={t('producer.plantings.cropSearchPlaceholder')}
                      listSearchValue={cropQuery}
                      onListSearchChange={setCropQuery}
                    />

                    <TouchableOpacity
                      onPress={() => setShowOther((v) => !v)}
                      style={styles.otherToggle}
                    >
                      <Text style={styles.otherToggleText}>{t('producer.plantings.customCropHint')}</Text>
                    </TouchableOpacity>
                    {showOther ? (
                      <EnterpriseTextField
                        value={customCrop}
                        onChangeText={(txt) => {
                          setCustomCrop(txt);
                          if (txt.trim()) setCropKey('');
                        }}
                        placeholder={t('producer.plantings.customCropPlaceholder')}
                      />
                    ) : null}

                    <EnterpriseTextField
                      label={t('producer.plantings.fieldDate')}
                      hint={t('producer.plantings.fieldDateHint')}
                      value={date}
                      onChangeText={setDate}
                      placeholder={t('producer.plantings.fieldDatePlaceholder')}
                      autoCapitalize="none"
                    />

                    <EnterpriseTextArea
                      label={t('producer.plantings.fieldNotes')}
                      value={notes}
                      onChangeText={setNotes}
                      placeholder={t('producer.plantings.phCrop')}
                      minRows={3}
                    />
                  </>
                )}
              </ScrollView>

              <View style={[styles.footer, { paddingBottom: Math.max(p.bottomInset, 12) }]}>
                {formErr ? <Text style={styles.formErr}>{formErr}</Text> : null}
                <EnterpriseButton
                  label={
                    step === 1
                      ? t('producer.fieldLogForm.farmerNext')
                      : t('producer.plantings.submit')
                  }
                  onPress={() => {
                    if (step === 1) {
                      if (!parcelId.trim()) return;
                      setStep(2);
                      return;
                    }
                    onSubmit({
                      parcelId,
                      crop: cropLabel(),
                      date,
                      notes,
                    });
                  }}
                  loading={saving}
                  disabled={saving || (step === 1 ? !parcelId.trim() : !cropChosen || !date.trim())}
                  fullWidth
                  size="large"
                />
              </View>
            </>
          )}
      </View>
    </BioVeraBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    minHeight: 360,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
  },
  sheetTitles: { flex: 1, paddingRight: 8 },
  stepFraction: { fontSize: 13, color: enterpriseColors.gray600, marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontWeight: '600', color: enterpriseColors.gray900 },
  noParcels: { padding: 20, fontSize: 14.5, color: enterpriseColors.gray600, lineHeight: 19 },
  lead: { fontSize: 14.5, color: enterpriseColors.gray600, lineHeight: 19, marginBottom: 12 },
  cropLead: { fontSize: 15, fontWeight: '600', color: enterpriseColors.gray900, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
    maxWidth: '100%',
  },
  chipSelected: {
    borderColor: enterpriseColors.primary,
    backgroundColor: enterpriseColors.primaryTint,
  },
  chipText: { fontSize: 14.5, color: enterpriseColors.gray700 },
  chipTextSelected: { color: enterpriseColors.primary, fontWeight: '600' },
  chipPending: { fontSize: 14, color: enterpriseColors.gray600, marginTop: 4 },
  lockedParcel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: enterpriseColors.gray100,
    marginBottom: 12,
  },
  lockedLabel: { fontSize: 13, color: enterpriseColors.gray600 },
  lockedValue: { fontSize: 13.5, fontWeight: '600', color: enterpriseColors.gray900, flex: 1 },
  changeLinkBtn: { minHeight: 44, justifyContent: 'center', marginBottom: 8 },
  changeLink: { fontSize: 14, fontWeight: '600', color: enterpriseColors.primary },
  otherToggle: { paddingVertical: 10, marginTop: 4 },
  otherToggleText: { fontSize: 13.5, fontWeight: '600', color: enterpriseColors.gray600 },
  dateHint: { fontSize: 13, color: enterpriseColors.gray600, marginTop: -8, marginBottom: 12, lineHeight: 18 },
  notesInput: { minHeight: 72, textAlignVertical: 'top' },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
    paddingTop: 12,
  },
  formErr: { fontSize: 14, color: enterpriseColors.destructive, marginBottom: 8, lineHeight: 20 },
  saveBtn: { minHeight: 52, justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.45 },
});
