/**
 * Step 2: Camera – Photo crates + Final quality check
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { pickFromCamera } from '../../../lib/camera-picker';

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
    try {
      const asset = await pickFromCamera({ t, quality: 0.8, allowsEditing: true });
      if (!asset?.uri) return;
      if (type === 'crate') onPhotoTaken(asset.uri);
      else onQualityPhotoTaken(asset.uri);
    } catch {
      Alert.alert(t('common.error'), t('common.tryAgain'));
    }
  };

  return (
    <View style={styles.container}>
      <PhotoCard
        title={t('packingFlow.step2.cratePhoto')}
        desc={t('packingFlow.step2.cratePhotoDesc')}
        uri={photoUri}
        emptyIcon={Camera}
        emptyLabel={t('packingFlow.step2.takePhoto')}
        onCapture={() => pickImage('crate')}
        onRetake={() => pickImage('crate')}
        retakeLabel={t('packingFlow.step2.retake')}
      />
      <PhotoCard
        title={t('packingFlow.step2.qualityCheck')}
        desc={t('packingFlow.step2.qualityCheckDesc')}
        uri={qualityPhotoUri}
        emptyIcon={ImageIcon}
        emptyLabel={t('packingFlow.step2.qualityPhoto')}
        onCapture={() => pickImage('quality')}
        onRetake={() => pickImage('quality')}
        retakeLabel={t('packingFlow.step2.retake')}
      />
    </View>
  );
}

function PhotoCard({
  title,
  desc,
  uri,
  emptyIcon: EmptyIcon,
  emptyLabel,
  onCapture,
  onRetake,
  retakeLabel,
}: {
  title: string;
  desc: string;
  uri: string | null;
  emptyIcon: typeof Camera;
  emptyLabel: string;
  onCapture: () => void;
  onRetake: () => void;
  retakeLabel: string;
}) {
  return (
    <View style={[enterpriseUi.inAppPanel, styles.card]}>
      <Text style={enterpriseUi.navRowTitle}>{title}</Text>
      <Text style={[enterpriseUi.navRowSubtitle, styles.cardDesc]}>{desc}</Text>
      {uri ? (
        <View>
          <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
          <TouchableOpacity style={styles.retakeBtn} onPress={onRetake} activeOpacity={0.72}>
            <Camera size={18} color={enterpriseColors.primary} strokeWidth={1.5} />
            <Text style={styles.retakeText}>{retakeLabel}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.captureBtn} onPress={onCapture} activeOpacity={0.72}>
          <EmptyIcon size={44} color={enterpriseColors.primary} strokeWidth={1.5} />
          <Text style={styles.captureText}>{emptyLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  card: {
    padding: 18,
  },
  cardDesc: {
    marginTop: 4,
    marginBottom: 14,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    minHeight: 44,
  },
  retakeText: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.primary,
  },
  captureBtn: {
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: enterpriseColors.gray100,
  },
  captureText: {
    fontSize: 15,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    marginTop: 10,
  },
});
