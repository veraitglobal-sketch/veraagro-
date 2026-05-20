import { Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import type { TFunction } from 'i18next';

export type EnsureLocationOptions = {
  /** In-app explanation before the OS dialog (undetermined only). */
  rationale?: boolean;
  /** Offer Open Settings when denied or services off. */
  openSettingsOnDeny?: boolean;
};

function showOpenSettingsAlert(t: TFunction, titleKey: string, bodyKey: string): void {
  Alert.alert(t(titleKey), t(bodyKey), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('producer.fieldLogAlerts.openSettings'),
      onPress: () => void Linking.openSettings(),
    },
  ]);
}

function showLocationRationale(t: TFunction): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      t('producer.permissions.locationRationaleTitle'),
      t('producer.permissions.locationRationaleBody'),
      [
        { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
        { text: t('producer.permissions.continue'), onPress: () => resolve(true) },
      ],
    );
  });
}

/** GPS hardware / system location services (not app permission). */
export async function ensureLocationServicesEnabled(
  t: TFunction,
  openSettingsOnDeny = true,
): Promise<boolean> {
  const enabled = await Location.hasServicesEnabledAsync();
  if (enabled) return true;
  if (openSettingsOnDeny) {
    showOpenSettingsAlert(
      t,
      'producer.permissions.locationServicesTitle',
      'producer.permissions.locationServicesBody',
    );
  }
  return false;
}

/**
 * Request foreground location only when the user is performing a GPS action
 * (field log, growth journal, map center, etc.) — same pattern as hairmap2 map button.
 */
export async function ensureForegroundLocationPermission(
  t: TFunction,
  options: EnsureLocationOptions = {},
): Promise<boolean> {
  const { rationale = false, openSettingsOnDeny = true } = options;

  if (!(await ensureLocationServicesEnabled(t, openSettingsOnDeny))) {
    return false;
  }

  let perm = await Location.getForegroundPermissionsAsync();
  if (perm.status === 'granted') return true;

  if (perm.status === 'denied' && perm.canAskAgain === false) {
    if (openSettingsOnDeny) {
      showOpenSettingsAlert(
        t,
        'producer.permissions.locationDeniedTitle',
        'producer.permissions.locationDeniedBody',
      );
    }
    return false;
  }

  if (perm.status === 'undetermined' && rationale) {
    const proceed = await showLocationRationale(t);
    if (!proceed) return false;
  }

  perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status === 'granted') return true;

  if (openSettingsOnDeny) {
    showOpenSettingsAlert(
      t,
      'producer.permissions.locationDeniedTitle',
      'producer.permissions.locationDeniedBody',
    );
  }
  return false;
}

export async function isForegroundLocationGranted(): Promise<boolean> {
  const perm = await Location.getForegroundPermissionsAsync();
  return perm.status === 'granted';
}

export type GrowerPosition = { lat: number; lng: number; accuracy?: number };

export async function getCurrentGrowerPosition(
  t: TFunction,
  options?: EnsureLocationOptions & { accuracy?: Location.Accuracy },
): Promise<GrowerPosition | null> {
  const granted = await ensureForegroundLocationPermission(t, {
    rationale: true,
    openSettingsOnDeny: true,
    ...options,
  });
  if (!granted) return null;

  try {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: options?.accuracy ?? Location.Accuracy.High,
    });
    const acc =
      loc.coords.accuracy != null && Number.isFinite(loc.coords.accuracy)
        ? loc.coords.accuracy
        : undefined;
    return { lat: loc.coords.latitude, lng: loc.coords.longitude, accuracy: acc };
  } catch {
    Alert.alert(
      t('producer.fieldLogAlerts.locationError'),
      t('producer.fieldLogAlerts.locationErrorFallback'),
    );
    return null;
  }
}
