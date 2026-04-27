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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';

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
  estateName?: string;
  parcelLabel?: string;
  planLabel?: string;
};

/**
 * Web-aligned flow: optional growth stage + notes, then one GPS photo (handled by parent).
 */
export function AddGrowthLogModal({
  visible,
  onClose,
  onSubmit,
  busy,
  estateName,
  parcelLabel,
  planLabel,
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
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: theme.borderRadius.lg,
            borderTopRightRadius: theme.borderRadius.lg,
            paddingTop: theme.spacing.md,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.lg),
            maxHeight: '88%',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: p.screenPaddingLeft,
              marginBottom: theme.spacing.sm,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text.primary }}>
              {t('producer.growthJournal.addLogTitle')}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityRole="button">
              <X size={22} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: p.screenPaddingLeft, paddingBottom: theme.spacing.lg }}
          >
            <Text style={{ fontSize: 12, color: colors.text.secondary, lineHeight: 18, marginBottom: theme.spacing.md }}>
              {t('producer.growthJournal.addLogContext', {
                estate: estateName || '—',
                parcel: parcelLabel || t('producer.growthJournal.allParcelsContext'),
                plan: planLabel || '—',
              })}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text.tertiary, marginBottom: 6 }}>
              {t('producer.growthJournal.growthStageLabel')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {GROWTH_STAGE_PRESETS.map((s) => {
                const sel = growthStage === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => {
                      setGrowthStage(sel ? '' : s);
                      setCustomStage('');
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: sel ? colors.primary : colors.border,
                      backgroundColor: sel ? `${colors.primary}12` : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 12, color: sel ? colors.primary : colors.text.secondary }}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => setGrowthStage((prev) => (prev === '__custom__' ? '' : '__custom__'))}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: growthStage === '__custom__' ? colors.primary : colors.border,
                  backgroundColor: growthStage === '__custom__' ? `${colors.primary}12` : 'transparent',
                }}
              >
                <Text
                  style={{ fontSize: 12, color: growthStage === '__custom__' ? colors.primary : colors.text.secondary }}
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
                placeholderTextColor={colors.text.tertiary}
                style={{
                  borderWidth: 0.5,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  color: colors.text.primary,
                  marginBottom: theme.spacing.md,
                }}
              />
            ) : null}
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text.tertiary, marginBottom: 6 }}>
              {t('producer.growthJournal.notesLabel')}
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={t('producer.growthJournal.notesPlaceholder')}
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 0.5,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
                color: colors.text.primary,
                minHeight: 88,
                textAlignVertical: 'top',
                marginBottom: theme.spacing.lg,
              }}
            />
            <View
              style={{
                borderWidth: 1,
                borderColor: `${colors.primary}55`,
                backgroundColor: `${colors.primary}0c`,
                borderRadius: theme.borderRadius.md,
                padding: 12,
                marginBottom: theme.spacing.md,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.primary }}>
                {t('producer.growthJournal.photoRequiredLineTitle')}
              </Text>
              <Text style={{ fontSize: 12, color: colors.text.secondary, lineHeight: 18, marginTop: 6 }}>
                {t('producer.growthJournal.photoRequiredLineBody')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={submit}
              disabled={busy}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: theme.borderRadius.md,
                alignItems: 'center',
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.background }}>
                  {t('producer.growthJournal.takePhotoAndSave')}
                </Text>
              )}
            </TouchableOpacity>
            <Text style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 10, lineHeight: 16 }}>
              {t('producer.growthJournal.addLogFooter')}
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
