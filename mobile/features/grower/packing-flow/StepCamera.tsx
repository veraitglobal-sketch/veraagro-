/**
 * Step 2: Camera – Photo crates + Final quality check (top layer raspberry, no mold/foreign bodies)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../../lib/theme';

interface Props {
  photoUri: string | null;
  qualityPhotoUri: string | null;
  onPhotoTaken: (uri: string) => void;
  onQualityPhotoTaken: (uri: string) => void;
}

export default function StepCamera({
  photoUri,
  qualityPhotoUri,
  onPhotoTaken,
  onQualityPhotoTaken,
}: Props) {
  const { t } = useTranslation();

  const pickImage = async (type: 'crate' | 'quality') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('alerts.warning'), t('producer.scanner.cameraPermissionBody'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      if (type === 'crate') onPhotoTaken(result.assets[0].uri);
      else onQualityPhotoTaken(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      {/* Crate photo */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('packingFlow.step2.cratePhoto')}</Text>
        <Text style={styles.cardDesc}>{t('packingFlow.step2.cratePhotoDesc')}</Text>
        {photoUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
            <TouchableOpacity style={styles.retakeBtn} onPress={() => pickImage('crate')}>
              <Camera size={18} color={theme.colors.primary} />
              <Text style={styles.retakeText}>{t('packingFlow.step2.retake')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.captureBtn} onPress={() => pickImage('crate')}>
            <Camera size={48} color={theme.colors.primary} />
            <Text style={styles.captureText}>{t('packingFlow.step2.takePhoto')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quality check photo */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('packingFlow.step2.qualityCheck')}</Text>
        <Text style={styles.cardDesc}>{t('packingFlow.step2.qualityCheckDesc')}</Text>
        {qualityPhotoUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: qualityPhotoUri }} style={styles.preview} resizeMode="cover" />
            <TouchableOpacity style={styles.retakeBtn} onPress={() => pickImage('quality')}>
              <Camera size={18} color={theme.colors.primary} />
              <Text style={styles.retakeText}>{t('packingFlow.step2.retake')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.captureBtn} onPress={() => pickImage('quality')}>
            <ImageIcon size={48} color={theme.colors.primary} />
            <Text style={styles.captureText}>{t('packingFlow.step2.qualityPhoto')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing.lg },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: { ...theme.typography.h3, color: theme.colors.text.primary, marginBottom: theme.spacing.xs },
  cardDesc: { ...theme.typography.bodySmall, color: theme.colors.text.secondary, marginBottom: theme.spacing.md },
  previewWrap: { position: 'relative' },
  preview: { width: '100%', height: 200, borderRadius: theme.borderRadius.md },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing.sm,
  },
  retakeText: { fontSize: 14, color: theme.colors.primary, fontWeight: '500' },
  captureBtn: {
    height: 160,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureText: { ...theme.typography.bodySmall, color: theme.colors.text.secondary, marginTop: theme.spacing.sm },
});
