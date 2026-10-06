import { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../lib/theme';
import { passportAPI } from '../lib/api';

export default function ReportProblemForm({
  batchId,
  badgeSerial,
}: {
  batchId: string;
  badgeSerial?: string | null;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ reportNumber: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef(`mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, base64: true });
    if (picked.canceled || !picked.assets[0]?.base64) {
      setPhotoDataUrl(null);
      return;
    }
    const mime = picked.assets[0].mimeType ?? 'image/jpeg';
    setPhotoDataUrl(`data:${mime};base64,${picked.assets[0].base64}`);
  };

  const submit = async () => {
    if (!description.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const raw = await passportAPI.submitReport(batchId, {
        description: description.trim(),
        contactEmail: contactEmail.trim() || undefined,
        photoDataUrl: photoDataUrl ?? undefined,
        idempotencyKey: idempotencyKey.current,
      }, badgeSerial);
      setResult({ reportNumber: raw.reportNumber });
      setDescription('');
      setContactEmail('');
      setPhotoDataUrl(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('buyer.passport.reportError', 'Could not send the report.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <View style={styles.confirmBox}>
        <Text style={styles.confirmText}>
          {t('buyer.passport.reportConfirm', { number: result.reportNumber, defaultValue: `Report received. Reference: ${result.reportNumber}` })}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <TouchableOpacity onPress={() => setOpen((v) => !v)} style={styles.toggle}>
        <Text style={styles.toggleText}>{t('buyer.passport.reportTitle', 'Report a problem')}</Text>
      </TouchableOpacity>
      {open ? (
        <View style={styles.form}>
          <Text style={styles.lead}>{t('buyer.passport.reportLead', 'Describe the issue. Contact is optional and not public.')}</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder={t('buyer.passport.reportPlaceholder', 'Describe the issue…')}
            style={styles.textarea}
          />
          <TouchableOpacity onPress={() => void pickPhoto()} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>
              {photoDataUrl ? t('buyer.passport.reportPhotoAdded', 'Photo attached') : t('buyer.passport.reportAddPhoto', 'Add photo (optional)')}
            </Text>
          </TouchableOpacity>
          <TextInput
            value={contactEmail}
            onChangeText={setContactEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder={t('buyer.passport.reportContact', 'Email for reply (optional)')}
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            disabled={submitting || !description.trim()}
            onPress={() => void submit()}
            style={[styles.primaryBtn, (submitting || !description.trim()) && styles.primaryBtnDisabled]}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{t('buyer.passport.reportSubmit', 'Send report')}</Text>}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', borderRadius: 12, padding: 12, marginTop: 8 },
  toggle: { minHeight: 48, justifyContent: 'center' },
  toggleText: { fontSize: 15, fontWeight: '500', color: theme.colors.text.primary },
  form: { marginTop: 8, gap: 10 },
  lead: { fontSize: 13, color: theme.colors.text.secondary },
  textarea: { borderWidth: 0.5, borderColor: theme.colors.border, borderRadius: 8, padding: 12, minHeight: 96, fontSize: 15, textAlignVertical: 'top' },
  input: { borderWidth: 0.5, borderColor: theme.colors.border, borderRadius: 8, padding: 12, fontSize: 15 },
  secondaryBtn: { minHeight: 44, justifyContent: 'center' },
  secondaryBtnText: { fontSize: 14, color: theme.colors.primary },
  primaryBtn: { minHeight: 48, borderRadius: 8, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  error: { fontSize: 13, color: theme.colors.error },
  confirmBox: { borderRadius: 8, backgroundColor: '#ECFDF5', borderWidth: 0.5, borderColor: '#A7F3D0', padding: 12, marginTop: 8 },
  confirmText: { fontSize: 14, color: '#065F46' },
});
