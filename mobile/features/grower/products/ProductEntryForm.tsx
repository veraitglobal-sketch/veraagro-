import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../../lib/theme';
import { PendingProduct } from '../../../lib/offline-storage';

type Source = 'qr' | 'manual';

interface ProductEntryFormProps {
  onSubmit: (entry: Omit<PendingProduct, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  onCancel?: () => void;
  initialQrCode?: string;
  initialSource?: Source;
}

const UNITS = ['kg', 'l', 'kom', 'vreća', 'pakovanje'];

export default function ProductEntryForm({
  onSubmit,
  onCancel,
  initialQrCode = '',
  initialSource = 'manual',
}: ProductEntryFormProps) {
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
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.sourceBtn, source === 'manual' && styles.sourceBtnActive]}
          onPress={() => setSource('manual')}
        >
          <Text style={[styles.sourceBtnText, source === 'manual' && styles.sourceBtnTextActive]}>Ručni unos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sourceBtn, source === 'qr' && styles.sourceBtnActive]}
          onPress={() => setSource('qr')}
        >
          <Text style={[styles.sourceBtnText, source === 'qr' && styles.sourceBtnTextActive]}>QR</Text>
        </TouchableOpacity>
      </View>

      {source === 'qr' && (
        <TextInput
          style={styles.input}
          placeholder="QR kod (opciono)"
          placeholderTextColor={theme.colors.text.tertiary}
          value={qrCode}
          onChangeText={setQrCode}
          editable={!initialQrCode}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Naziv proizvoda *"
        placeholderTextColor={theme.colors.text.tertiary}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Šta proizvod sadrži (sastav)"
        placeholderTextColor={theme.colors.text.tertiary}
        value={contents}
        onChangeText={setContents}
        multiline
        numberOfLines={2}
      />

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.inputQuantity]}
          placeholder="Količina"
          placeholderTextColor={theme.colors.text.tertiary}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="decimal-pad"
        />
        <View style={styles.unitRow}>
          {UNITS.slice(0, 4).map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
              onPress={() => setUnit(u)}
            >
              <Text style={[styles.unitBtnText, unit === u && styles.unitBtnTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Parcela / njiva (opciono)"
        placeholderTextColor={theme.colors.text.tertiary}
        value={parcelOrEstate}
        onChangeText={setParcelOrEstate}
      />

      <View style={styles.actions}>
        {onCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={saving}>
            <Text style={styles.cancelBtnText}>Odustani</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.submitBtn, (!name.trim() || saving) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!name.trim() || saving}
        >
          <Text style={styles.submitBtnText}>{saving ? 'Čuvam…' : 'Sačuvaj u telefonu'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  sourceBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sourceBtnActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  sourceBtnText: { fontSize: 16, color: theme.colors.text.secondary },
  sourceBtnTextActive: { color: theme.colors.text.inverse, fontWeight: '600' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    marginBottom: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  textArea: { minHeight: 64 },
  inputQuantity: { flex: 1 },
  unitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  unitBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  unitBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  unitBtnText: { fontSize: 14, color: theme.colors.text.secondary },
  unitBtnTextActive: { color: theme.colors.text.inverse },
  actions: { flexDirection: 'row', gap: 12, marginTop: theme.spacing.md, justifyContent: 'flex-end' },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  cancelBtnText: { fontSize: 16, color: theme.colors.text.secondary },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.md,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 16, color: theme.colors.text.inverse, fontWeight: '600' },
});
