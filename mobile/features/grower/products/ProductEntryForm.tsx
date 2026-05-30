import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PendingProduct } from '../../../lib/offline-storage';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import {
  EnterpriseButton,
  EnterpriseTextField,
  EnterpriseTextArea,
} from '../../../design-system';

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
        <EnterpriseTextField
          placeholder={t('producer.products.qrPlaceholder')}
          value={qrCode}
          onChangeText={setQrCode}
          editable={!initialQrCode}
          autoCapitalize="none"
        />
      ) : null}

      <EnterpriseTextField
        label={t('producer.products.nameLabel')}
        placeholder={t('producer.products.namePlaceholder')}
        value={name}
        onChangeText={setName}
        required
        size="farmer"
      />

      <EnterpriseTextArea
        label={t('producer.products.contentsLabel')}
        placeholder={t('producer.products.contentsPlaceholder')}
        value={contents}
        onChangeText={setContents}
        minRows={2}
      />

      <EnterpriseTextField
        label={t('producer.products.quantityLabel')}
        placeholder={t('producer.products.quantityPlaceholder')}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="decimal-pad"
        size="farmer"
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

      <EnterpriseTextField
        label={t('producer.products.parcelLabel')}
        placeholder={t('producer.products.parcelPlaceholder')}
        value={parcelOrEstate}
        onChangeText={setParcelOrEstate}
        size="farmer"
      />

      <View style={styles.actions}>
        {onCancel ? (
          <EnterpriseButton label={t('common.cancel')} onPress={onCancel} variant="ghost" disabled={saving} />
        ) : null}
        <EnterpriseButton
          label={saving ? t('producer.products.saving') : t('producer.products.saveToDevice')}
          onPress={() => void handleSubmit()}
          loading={saving}
          disabled={!name.trim() || saving}
          style={styles.submitBtn}
        />
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
  unitWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -8,
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
  submitBtn: {
    minWidth: 160,
  },
});
