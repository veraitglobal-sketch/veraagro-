import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const KEY = 'app_device_id';

/** Stable ID for growth log / anti-fraud (per install). */
export async function getOrCreateDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(KEY);
  if (!id) {
    id = Crypto.randomUUID();
    await AsyncStorage.setItem(KEY, id);
  }
  return id;
}
