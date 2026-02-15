import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X } from 'lucide-react-native';
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('producer.compliance.permissionsTitle'), t('producer.compliance.galleryPermissionRequired'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('producer.compliance.permissionsTitle'), t('producer.compliance.cameraPermissionRequired'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
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
            <Text style={styles.btnText}>Uslikaj</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={pickImage}>
            <Text style={styles.btnText}>Izaberi iz galerije</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Ukloni</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Čuvam…' : 'Sačuvaj (šalje se kad ima neta)'}</Text>
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
