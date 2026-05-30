import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PendingCost } from '../../../lib/offline-storage';
import type { GrowerParcelRow } from '../../../lib/load-grower-parcels';
import { CostAllocationPicker, type CostPlantingOption } from './CostAllocationPicker';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import {
  EnterpriseButton,
  EnterpriseTextField,
  EnterpriseTextArea,
} from '../../../design-system';

interface CostEntryFormProps {
  parcels: GrowerParcelRow[];
  allocationLoading: boolean;
  plantingsForParcel: (parcelId: string) => CostPlantingOption[];
  resolveAllocationLabels: (
    parcelId: string,
    plantingId?: string,
  ) => { estateId: string; parcelLabel: string; plantingLabel?: string };
  onSubmit: (entry: Omit<PendingCost, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  onCancel?: () => void;
}

export default function CostEntryForm({
  parcels,
  allocationLoading,
  plantingsForParcel,
  resolveAllocationLabels,
  onSubmit,
  onCancel,
}: CostEntryFormProps) {
  const { t } = useTranslation();
  const [parcelId, setParcelId] = useState('');
  const [plantingId, setPlantingId] = useState('');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const plantings = useMemo(() => plantingsForParcel(parcelId), [plantingsForParcel, parcelId]);

  useEffect(() => {
    if (parcels.length === 1 && !parcelId) setParcelId(parcels[0].id);
  }, [parcels, parcelId]);

  useEffect(() => {
    if (!parcelId) {
      setPlantingId('');
      return;
    }
    setPlantingId((prev) => {
      if (plantings.length === 0) return '';
      return plantings.some((p) => p.id === prev) ? prev : plantings[0].id;
    });
  }, [parcelId, plantings]);

  const handleSubmit = async () => {
    setFormErr(null);
    const a = parseFloat(amount.replace(',', '.'));
    if (!parcelId.trim()) {
      setFormErr(t('producer.costCalculator.validationParcel'));
      return;
    }
    if (!label.trim()) {
      setFormErr(t('producer.costCalculator.validationName'));
      return;
    }
    if (isNaN(a) || a < 0) {
      setFormErr(t('producer.costCalculator.validationAmount'));
      return;
    }
    if (plantings.length > 0 && !plantingId) {
      setFormErr(t('producer.costCalculator.validationPlanting'));
      return;
    }

    const { estateId, parcelLabel, plantingLabel } = resolveAllocationLabels(parcelId, plantingId || undefined);
    if (!estateId) {
      setFormErr(t('producer.costCalculator.validationParcel'));
      return;
    }

    setSaving(true);
    try {
      const trimmedNote = note.trim();
      await onSubmit({
        type: 'manual',
        label: label.trim(),
        amount: a,
        currency: 'EUR',
        estateId,
        parcelId,
        harvestAnnouncementId: plantingId || undefined,
        parcelLabel,
        plantingLabel,
        ...(trimmedNote ? { note: trimmedNote } : {}),
      });
      setLabel('');
      setAmount('');
      setNote('');
      setFormErr(null);
    } finally {
      setSaving(false);
    }
  };

  const canSubmit =
    Boolean(parcelId && label.trim()) &&
    !saving &&
    (plantings.length === 0 || Boolean(plantingId));

  return (
    <View>
      <CostAllocationPicker
        parcels={parcels}
        selectedParcelId={parcelId}
        onParcelSelect={(id) => {
          setParcelId(id);
          setFormErr(null);
        }}
        plantings={plantings}
        selectedPlantingId={plantingId}
        onPlantingSelect={(id) => {
          setPlantingId(id);
          setFormErr(null);
        }}
        loading={allocationLoading}
      />

      <EnterpriseTextField
        label={t('producer.costCalculator.costNameLabel')}
        placeholder={t('producer.costCalculator.costNamePlaceholder')}
        value={label}
        onChangeText={setLabel}
        size="farmer"
      />
      <EnterpriseTextField
        label={t('producer.costCalculator.amountLabel')}
        placeholder={t('producer.costCalculator.amountPlaceholder')}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        size="farmer"
      />
      <EnterpriseTextArea
        label={t('producer.costCalculator.noteLabel')}
        placeholder={t('producer.costCalculator.notePlaceholder')}
        value={note}
        onChangeText={setNote}
        minRows={2}
      />

      {formErr ? <Text style={styles.formErr}>{formErr}</Text> : null}

      <View style={styles.actions}>
        {onCancel ? (
          <EnterpriseButton
            label={t('common.cancel')}
            onPress={onCancel}
            variant="ghost"
            disabled={saving}
          />
        ) : null}
        <EnterpriseButton
          label={saving ? t('producer.costCalculator.saving') : t('producer.costCalculator.addCost')}
          onPress={() => void handleSubmit()}
          loading={saving}
          disabled={!canSubmit}
          style={styles.submitBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formErr: {
    fontSize: 14,
    color: enterpriseColors.destructive,
    marginBottom: 10,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  submitBtn: {
    minWidth: 140,
  },
});
