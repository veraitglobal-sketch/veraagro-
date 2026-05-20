import { Alert, InteractionManager, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  /** Bio Vera Serbian explanation before the OS / Expo dialog (default true). */
  rationale?: boolean;
  rationaleTitleKey?: string;
  rationaleBodyKey?: string;
};

const EXPO_GO_CAMERA_HINT_KEY = 'biovera_expo_go_camera_hint_v1';

function showCameraRationale(
  t: TFunction,
  titleKey: string,
  bodyKey: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(t(titleKey), t(bodyKey), [
      { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
      { text: t('producer.permissions.cameraAllow'), onPress: () => resolve(true) },
    ]);
  });
}

/** One-time note when running inside Expo Go (not the production Bio Vera app). */
async function maybeExplainExpoGoCameraDialog(t: TFunction): Promise<void> {
  if (Constants.appOwnership !== 'expo') return;
  if (await AsyncStorage.getItem(EXPO_GO_CAMERA_HINT_KEY)) return;
  await AsyncStorage.setItem(EXPO_GO_CAMERA_HINT_KEY, '1');
  await new Promise<void>((resolve) => {
    Alert.alert(
      t('producer.permissions.expoGoCameraTitle'),
      t('producer.permissions.expoGoCameraBody'),
      [{ text: t('common.ok'), onPress: () => resolve() }],
    );
  });
}

async function ensureCameraPermission(
  t: TFunction,
  options: Pick<PickImageOptions, 'rationale' | 'rationaleTitleKey' | 'rationaleBodyKey'> = {},
): Promise<boolean> {
  const {
    rationale = true,
    rationaleTitleKey = 'producer.permissions.cameraRationaleTitle',
    rationaleBodyKey = 'producer.permissions.cameraRationaleBody',
  } = options;

  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.status === 'granted') return true;

  if (current.status === 'denied' && current.canAskAgain === false) {
    permissionAlert(t, 'producer.fieldLogAlerts.camPermTitle', 'producer.fieldLogAlerts.camPermBody');
    return false;
  }

  if (rationale && current.status === 'undetermined') {
    const proceed = await showCameraRationale(t, rationaleTitleKey, rationaleBodyKey);
    if (!proceed) return false;
    await maybeExplainExpoGoCameraDialog(t);
  }

  const { status } = await ImagePicker.requestCameraPermissionsAsync();
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
    const granted = await ensureCameraPermission(opts.t, opts);
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
