import { Alert, InteractionManager, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { TFunction } from 'i18next';

/** Expo SDK 54+ — prefer string media types over deprecated MediaTypeOptions. */
export const IMAGE_PICKER_MEDIA_TYPES: ImagePicker.MediaType[] = ['images'];

export type PickImageOptions = {
  t: TFunction;
  quality?: number;
  allowsEditing?: boolean;
  /** Wait for RN modals / transitions to finish (iOS camera after Modal). */
  defer?: boolean;
};

async function ensureCameraPermission(t: TFunction): Promise<boolean> {
  let status = (await ImagePicker.getCameraPermissionsAsync()).status;
  if (status !== 'granted') {
    ({ status } = await ImagePicker.requestCameraPermissionsAsync());
  }
  return status === 'granted';
}

async function ensureLibraryPermission(t: TFunction): Promise<boolean> {
  let status = (await ImagePicker.getMediaLibraryPermissionsAsync()).status;
  if (status !== 'granted') {
    ({ status } = await ImagePicker.requestMediaLibraryPermissionsAsync());
  }
  return status === 'granted';
}

function permissionAlert(
  t: TFunction,
  titleKey: string,
  bodyKey: string,
  extraButtons?: Array<{ text: string; onPress: () => void }>,
): void {
  Alert.alert(t(titleKey), t(bodyKey), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('producer.fieldLogAlerts.openSettings'), onPress: () => void Linking.openSettings() },
    ...(extraButtons ?? []),
  ]);
}

async function runPick<T>(fn: () => Promise<T>, defer?: boolean): Promise<T> {
  if (!defer) return fn();

  return new Promise((resolve, reject) => {
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        const delay = Platform.OS === 'ios' ? 520 : 160;
        setTimeout(() => {
          void fn().then(resolve).catch(reject);
        }, delay);
      });
    });
  });
}

/** Launch device camera; returns asset or null when cancelled. */
export async function pickFromCamera(opts: PickImageOptions): Promise<ImagePicker.ImagePickerAsset | null> {
  return runPick(async () => {
    const granted = await ensureCameraPermission(opts.t);
    if (!granted) {
      permissionAlert(opts.t, 'producer.fieldLogAlerts.camPermTitle', 'producer.fieldLogAlerts.camPermBody');
      return null;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: IMAGE_PICKER_MEDIA_TYPES,
        allowsEditing: opts.allowsEditing ?? false,
        quality: opts.quality ?? 0.72,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        return result.assets[0];
      }
      return null;
    } catch (e) {
      console.warn('pickFromCamera:', e);
      Alert.alert(
        opts.t('producer.fieldLogAlerts.camFailedTitle'),
        opts.t('producer.fieldLogAlerts.camFailedBody'),
      );
      return null;
    }
  }, opts.defer);
}

/** Pick a single image from the photo library. */
export async function pickFromGallery(opts: PickImageOptions): Promise<ImagePicker.ImagePickerAsset | null> {
  return runPick(async () => {
    const granted = await ensureLibraryPermission(opts.t);
    if (!granted) {
      permissionAlert(opts.t, 'producer.fieldLogAlerts.galleryPermTitle', 'producer.fieldLogAlerts.galleryPermBody');
      return null;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: IMAGE_PICKER_MEDIA_TYPES,
        allowsEditing: opts.allowsEditing ?? false,
        quality: opts.quality ?? 0.72,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        return result.assets[0];
      }
      return null;
    } catch (e) {
      console.warn('pickFromGallery:', e);
      Alert.alert(opts.t('error'), opts.t('producer.fieldLogAlerts.galleryError'));
      return null;
    }
  }, opts.defer);
}

/**
 * After closing a React Native Modal, run work (e.g. open camera) once UI is idle.
 * Returns cancel function — call on unmount or before scheduling again.
 */
export function scheduleAfterModalDismiss(fn: () => void | Promise<void>): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  InteractionManager.runAfterInteractions(() => {
    if (cancelled) return;
    requestAnimationFrame(() => {
      if (cancelled) return;
      const delay = Platform.OS === 'ios' ? 520 : 160;
      timer = setTimeout(() => {
        if (!cancelled) void fn();
      }, delay);
    });
  });

  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
}
