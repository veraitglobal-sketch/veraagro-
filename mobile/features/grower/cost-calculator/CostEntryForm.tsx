import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../../lib/theme';
import { PendingCost } from '../../../lib/offline-storage';

interface CostEntryFormProps {
  onSubmit: (entry: Omit<PendingCost, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  onCancel?: () => void;
}

export default function CostEntryForm({ onSubmit, onCancel }: CostEntryFormProps) {
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
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Naziv troška (npr. Gorivo, Đubrivo)"
        placeholderTextColor={theme.colors.text.tertiary}
        value={label}
        onChangeText={setLabel}
      />
      <TextInput
        style={styles.input}
        placeholder="Iznos (EUR)"
        placeholderTextColor={theme.colors.text.tertiary}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <View style={styles.actions}>
        {onCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={saving}>
            <Text style={styles.cancelBtnText}>Odustani</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.submitBtn, (!label.trim() || saving) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!label.trim() || saving}
        >
          <Text style={styles.submitBtnText}>{saving ? 'Čuvam…' : 'Dodaj trošak'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.md },
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
  actions: { flexDirection: 'row', gap: 12, marginTop: theme.spacing.sm, justifyContent: 'flex-end' },
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
