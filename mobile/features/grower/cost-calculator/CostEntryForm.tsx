import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PendingCost } from '../../../lib/offline-storage';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';

interface CostEntryFormProps {
  onSubmit: (entry: Omit<PendingCost, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  onCancel?: () => void;
}

export default function CostEntryForm({ onSubmit, onCancel }: CostEntryFormProps) {
  const { t } = useTranslation();
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const a = parseFloat(amount.replace(',', '.'));
    if (!label.trim()) return;
    if (isNaN(a) || a < 0) return;

    setSaving(true);
    try {
      await onSubmit({ type: 'manual', label: label.trim(), amount: a, currency: 'EUR' });
      setLabel('');
      setAmount('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <Text style={enterpriseUi.inAppSectionLabel}>{t('producer.costCalculator.costNameLabel')}</Text>
      <TextInput
        style={growerUi.formInput}
        placeholder={t('producer.costCalculator.costNamePlaceholder')}
        placeholderTextColor={enterpriseColors.gray600}
        value={label}
        onChangeText={setLabel}
      />
      <Text style={enterpriseUi.inAppSectionLabel}>{t('producer.costCalculator.amountLabel')}</Text>
      <TextInput
        style={growerUi.formInput}
        placeholder={t('producer.costCalculator.amountPlaceholder')}
        placeholderTextColor={enterpriseColors.gray600}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <View style={styles.actions}>
        {onCancel ? (
          <TouchableOpacity onPress={onCancel} disabled={saving} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[enterpriseUi.authBtnPrimary, styles.submitBtn, (!label.trim() || saving) && styles.disabled]}
          onPress={() => void handleSubmit()}
          disabled={!label.trim() || saving}
        >
          <Text style={enterpriseUi.authBtnPrimaryText}>
            {saving ? t('producer.costCalculator.saving') : t('producer.costCalculator.addCost')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: enterpriseColors.gray600,
  },
  submitBtn: {
    minHeight: 48,
    paddingHorizontal: 20,
  },
  disabled: {
    opacity: 0.5,
  },
});
