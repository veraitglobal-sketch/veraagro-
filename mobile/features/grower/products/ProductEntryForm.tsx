import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PendingProduct } from '../../../lib/offline-storage';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';

type Source = 'qr' | 'manual';

interface ProductEntryFormProps {
  onSubmit: (entry: Omit<PendingProduct, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  onCancel?: () => void;
  initialQrCode?: string;
  initialSource?: Source;
}

const UNITS = ['kg', 'l', 'pcs', 'bag', 'pack'];

export default function ProductEntryForm({
  onSubmit,
  onCancel,
  initialQrCode = '',
  initialSource = 'manual',
}: ProductEntryFormProps) {
  const { t } = useTranslation();
  const [source, setSource] = useState<Source>(initialSource);
  const [qrCode, setQrCode] = useState(initialQrCode);
  const [name, setName] = useState('');
  const [contents, setContents] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [parcelOrEstate, setParcelOrEstate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const q = parseFloat(quantity.replace(',', '.'));
    if (!name.trim()) return;
    if (isNaN(q) || q <= 0) return;

    setSaving(true);
    try {
      await onSubmit({
        source,
        qrCode: source === 'qr' ? qrCode || undefined : undefined,
        name: name.trim(),
        contents: contents.trim() || name.trim(),
        quantity: q,
        unit,
        parcelOrEstate: parcelOrEstate.trim() || undefined,
      });
      setName('');
      setContents('');
      setQuantity('');
      setParcelOrEstate('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <View style={styles.sourceRow}>
        <TouchableOpacity
          style={[growerUi.filterChip, source === 'manual' && growerUi.filterChipOn]}
          onPress={() => setSource('manual')}
        >
          <Text style={[growerUi.filterChipText, source === 'manual' && growerUi.filterChipTextOn]}>
            {t('producer.products.sourceManual')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[growerUi.filterChip, source === 'qr' && growerUi.filterChipOn]}
          onPress={() => setSource('qr')}
        >
          <Text style={[growerUi.filterChipText, source === 'qr' && growerUi.filterChipTextOn]}>
            {t('producer.products.sourceQr')}
          </Text>
        </TouchableOpacity>
      </View>

      {source === 'qr' ? (
        <TextInput
          style={growerUi.formInput}
          placeholder={t('producer.products.qrPlaceholder')}
          placeholderTextColor={enterpriseColors.gray600}
          value={qrCode}
          onChangeText={setQrCode}
          editable={!initialQrCode}
        />
      ) : null}

      <Text style={enterpriseUi.inAppSectionLabel}>{t('producer.products.nameLabel')}</Text>
      <TextInput
        style={growerUi.formInput}
        placeholder={t('producer.products.namePlaceholder')}
        placeholderTextColor={enterpriseColors.gray600}
        value={name}
        onChangeText={setName}
      />

      <Text style={enterpriseUi.inAppSectionLabel}>{t('producer.products.contentsLabel')}</Text>
      <TextInput
        style={[growerUi.formInput, styles.textArea]}
        placeholder={t('producer.products.contentsPlaceholder')}
        placeholderTextColor={enterpriseColors.gray600}
        value={contents}
        onChangeText={setContents}
        multiline
        numberOfLines={2}
      />

      <Text style={enterpriseUi.inAppSectionLabel}>{t('producer.products.quantityLabel')}</Text>
      <View style={styles.qtyRow}>
        <TextInput
          style={[growerUi.formInput, styles.qtyInput]}
          placeholder={t('producer.products.quantityPlaceholder')}
          placeholderTextColor={enterpriseColors.gray600}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="decimal-pad"
        />
        <View style={styles.unitWrap}>
          {UNITS.map((u) => {
            const on = unit === u;
            return (
              <TouchableOpacity
                key={u}
                style={[growerUi.filterChip, styles.unitChip, on && growerUi.filterChipOn]}
                onPress={() => setUnit(u)}
              >
                <Text style={[growerUi.filterChipText, on && growerUi.filterChipTextOn]}>{u}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Text style={enterpriseUi.inAppSectionLabel}>{t('producer.products.parcelLabel')}</Text>
      <TextInput
        style={growerUi.formInput}
        placeholder={t('producer.products.parcelPlaceholder')}
        placeholderTextColor={enterpriseColors.gray600}
        value={parcelOrEstate}
        onChangeText={setParcelOrEstate}
      />

      <View style={styles.actions}>
        {onCancel ? (
          <TouchableOpacity onPress={onCancel} disabled={saving} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[enterpriseUi.authBtnPrimary, styles.submitBtn, (!name.trim() || saving) && styles.disabled]}
          onPress={() => void handleSubmit()}
          disabled={!name.trim() || saving}
        >
          <Text style={enterpriseUi.authBtnPrimaryText}>
            {saving ? t('producer.products.saving') : t('producer.products.saveToDevice')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sourceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  qtyRow: {
    marginBottom: 4,
  },
  qtyInput: {
    marginBottom: 10,
  },
  unitWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  unitChip: {
    paddingHorizontal: 12,
    minHeight: 44,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: enterpriseColors.gray600,
  },
  submitBtn: {
    paddingHorizontal: 20,
    minHeight: 48,
  },
  disabled: {
    opacity: 0.5,
  },
});
