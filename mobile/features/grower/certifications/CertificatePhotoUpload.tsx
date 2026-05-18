import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Camera, X } from 'lucide-react-native';
import { pickFromCamera, pickFromGallery } from '../../../lib/camera-picker';
import { theme } from '../../../lib/theme';
import { RequiredCert } from './useCertificationsData';
import { PendingCertificatePhoto } from '../../../lib/offline-storage';

interface CertificatePhotoUploadProps {
  cert: RequiredCert;
  onSave: (entry: Omit<PendingCertificatePhoto, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  onCancel: () => void;
}

export default function CertificatePhotoUpload({ cert, onSave, onCancel }: CertificatePhotoUploadProps) {
  const { t } = useTranslation();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const asset = await pickFromGallery({ t, allowsEditing: true, quality: 0.8 });
    if (asset?.uri) setPhotoUri(asset.uri);
  };

  const takePhoto = async () => {
    const asset = await pickFromCamera({ t, allowsEditing: true, quality: 0.8 });
    if (asset?.uri) setPhotoUri(asset.uri);
  };

  const handleSave = async () => {
    if (!photoUri) return;
    setSaving(true);
    try {
      await onSave({
        certificateId: cert.id,
        certificateTitle: cert.title,
        photoUri,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{cert.title}</Text>
      {cert.description ? <Text style={styles.desc}>{cert.description}</Text> : null}

      {!photoUri ? (
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.btn} onPress={takePhoto}>
            <Camera size={24} color={theme.colors.primary} strokeWidth={1} />
            <Text style={styles.btnText}>{t('producer.certifications.takePhoto')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={pickImage}>
            <Text style={styles.btnText}>{t('producer.certifications.chooseFromGallery')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>{t('producer.certifications.removePhoto')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? t('producer.products.saving') : t('producer.products.saveToDevice')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity onPress={onCancel} style={styles.backBtn}>
        <X size={20} color={theme.colors.text.secondary} strokeWidth={1} />
        <Text style={styles.backBtnText}>{t('common.close')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.md },
  title: { ...theme.typography.h3, color: theme.colors.text.primary, marginBottom: 4 },
  desc: { ...theme.typography.bodySmall, color: theme.colors.text.secondary, marginBottom: theme.spacing.md },
  buttons: { flexDirection: 'row', gap: 12, marginBottom: theme.spacing.md },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnText: { fontSize: 16, color: theme.colors.primary, fontWeight: '500' },
  preview: { width: '100%', height: 200, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.md },
  actions: { flexDirection: 'row', gap: 12, marginBottom: theme.spacing.md },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  cancelBtnText: { fontSize: 16, color: theme.colors.text.secondary },
  saveBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, color: theme.colors.text.inverse, fontWeight: '600' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backBtnText: { fontSize: 14, color: theme.colors.text.secondary },
});
