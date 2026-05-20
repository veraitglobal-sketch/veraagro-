import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import i18n from '../i18n/config';

const PREFS_KEY = 'biovera_post_login_notifications_v2';

function showNotificationRationale(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      i18n.t('producer.permissions.notificationsRationaleTitle'),
      i18n.t('producer.permissions.notificationsRationaleBody'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
        { text: i18n.t('producer.permissions.notificationsAllow'), onPress: () => resolve(true) },
      ],
    );
  });
}

function showNotificationsDeniedAlert(): void {
  Alert.alert(
    i18n.t('producer.permissions.notificationsDeniedTitle'),
    i18n.t('producer.permissions.notificationsDeniedBody'),
    [
      { text: i18n.t('common.cancel'), style: 'cancel' },
      {
        text: i18n.t('producer.fieldLogAlerts.openSettings'),
        onPress: () => void Linking.openSettings(),
      },
    ],
  );
}

export type RequestNotificationOptions = {
  /** Show Bio Vera explanation before the OS dialog (default true). */
  rationale?: boolean;
};

/**
 * Ask for push permission only in context (after login or settings toggle).
 * iOS/Android system text comes from Info.plist / manifest; farmers see our Alert first.
 */
export async function requestNotificationPermissionIfNeeded(
  options: RequestNotificationOptions = {},
): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { rationale = true } = options;
  const current = await Notifications.getPermissionsAsync();

  if (current.status === 'granted') return true;

  if (current.status === 'denied' && current.canAskAgain === false) {
    showNotificationsDeniedAlert();
    return false;
  }

  if (rationale && current.status === 'undetermined') {
    const proceed = await showNotificationRationale();
    if (!proceed) return false;
  }

  const result = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });

  if (result.status === 'granted') return true;

  showNotificationsDeniedAlert();
  return false;
}

/** Once after first entry into grower shell — after in-app explanation, then OS dialog. */
export async function runPostLoginPermissionsIfFirstTime(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const done = await AsyncStorage.getItem(PREFS_KEY);
    if (done === 'true') return;

    await new Promise<void>((resolve) => setTimeout(resolve, 800));
    const granted = await requestNotificationPermissionIfNeeded({ rationale: true });
    if (granted) {
      const { registerPushTokenWithBackend } = await import('./push-service');
      await registerPushTokenWithBackend();
    }
  } catch (e) {
    console.warn('[PostLoginPermissions]', e);
  } finally {
    await AsyncStorage.setItem(PREFS_KEY, 'true');
  }
}
