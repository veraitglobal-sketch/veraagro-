import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import axios from 'axios';
import { API_URL } from './api-url';
import i18n from '../i18n/config';
import api from './api';
import { axiosResponseStatus } from './api-error';
import { getOrCreateDeviceId } from './device-id';
import { requestNotificationPermissionIfNeeded } from './notification-permissions';

const PUSH_TOKEN_STORAGE_KEY = 'biovera_push_device_token';

function inferAppSurface(roles?: string[]): string {
  const r = new Set((roles ?? []).map((x) => String(x).trim().toUpperCase()).filter(Boolean));
  if (r.has('LOGISTICS_PARTNER') || r.has('DRIVER')) return 'logistics';
  if (r.has('MATERIAL_SUPPLIER') && !r.has('FARMER') && !r.has('GROWER')) return 'supplier';
  if (r.has('BUYER') || r.has('CUSTOMER')) return 'buyer';
  return 'grower';
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Bio Vera',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  });
}

/**
 * Native FCM (Android) / APNs (iOS) token. Requires EAS build + Firebase credentials (not Expo Go).
 */
export async function obtainNativePushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) {
    console.warn('[push] Push tokens require a physical device');
    return null;
  }

  const granted = await requestNotificationPermissionIfNeeded();
  if (!granted) return null;

  await ensureAndroidChannel();

  try {
    const native = await Notifications.getDevicePushTokenAsync();
    return native?.data ?? null;
  } catch (e) {
    console.warn('[push] getDevicePushToken failed:', e instanceof Error ? e.message : e);
    return null;
  }
}

export async function registerPushTokenWithBackend(roles?: string[]): Promise<boolean> {
  const token = await obtainNativePushToken();
  if (!token) return false;

  const deviceId = await getOrCreateDeviceId();
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  try {
    await api.post('/notifications/push/register', {
      token,
      platform,
      deviceId,
      appSurface: inferAppSurface(roles),
      locale: i18n.language?.slice(0, 2) || 'sr',
    });
  } catch (e) {
    const status = axiosResponseStatus(e);
    if (status === 404) {
      console.warn(
        '[push] POST /notifications/push/register not found — deploy latest API to Railway (push + user_push_devices migration).',
      );
      return false;
    }
    console.warn('[push] register failed:', e instanceof Error ? e.message : e);
    return false;
  }

  await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
  return true;
}

export async function unregisterPushTokenFromBackend(): Promise<void> {
  try {
    const [token, authToken] = await Promise.all([
      AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY),
      AsyncStorage.getItem('auth_token'),
    ]);
    if (!token || !authToken) return;
    const deviceId = await getOrCreateDeviceId();
    // Cleanup of an expired session must not trigger the API's 401 logout handler again.
    await axios.delete(`${API_URL.replace(/\/$/, '')}/notifications/push/register`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 5000,
      data: { token, deviceId },
    });
  } catch (e) {
    console.warn('[push] unregister failed:', e instanceof Error ? e.message : e);
  } finally {
    await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
  }
}

export async function refreshPushRegistrationIfAuthed(roles?: string[]): Promise<void> {
  const notifPref = await AsyncStorage.getItem('settings_notifications');
  if (notifPref === 'false') return;
  try {
    await registerPushTokenWithBackend(roles);
  } catch (e) {
    console.warn('[push] refresh registration failed:', e instanceof Error ? e.message : e);
  }
}
