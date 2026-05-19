import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react-native';
import { pickFromCamera, pickFromGallery } from '../../../lib/camera-picker';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
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
    <View style={[growerUi.scrollContent, styles.container]}>
      <View style={enterpriseUi.authPanel}>
        {cert.description ? (
          <Text style={[enterpriseUi.navRowSubtitle, styles.desc]}>{cert.description}</Text>
        ) : null}

        {!photoUri ? (
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.outlineBtn} onPress={takePhoto} activeOpacity={0.88}>
              <Camera size={22} color={enterpriseColors.primary} strokeWidth={1.5} />
              <Text style={styles.outlineBtnText}>{t('producer.certifications.takePhoto')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineBtn} onPress={pickImage} activeOpacity={0.88}>
              <Text style={styles.outlineBtnText}>{t('producer.certifications.chooseFromGallery')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>{t('producer.certifications.removePhoto')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[enterpriseUi.authBtnPrimary, styles.saveBtn, saving && styles.disabled]}
                onPress={() => void handleSave()}
                disabled={saving}
                activeOpacity={0.88}
              >
                <Text style={enterpriseUi.authBtnPrimaryText}>
                  {saving ? t('producer.products.saving') : t('producer.products.saveToDevice')}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity onPress={onCancel} style={styles.closeBtn} activeOpacity={0.72}>
        <Text style={styles.closeText}>{t('common.close')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  desc: {
    marginBottom: 16,
  },
  buttons: {
    gap: 10,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  },
  outlineBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.primary,
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  saveBtn: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  closeBtn: {
    marginTop: 20,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '500',
    color: enterpriseColors.gray600,
  },
});
