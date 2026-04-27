import * as Network from 'expo-network';

/**
 * True when the device has a data path that can reach the internet.
 * iOS may leave `isInternetReachable` null while connected — we treat that as online.
 */
export async function isDeviceOnline(): Promise<boolean> {
  try {
    const s = await Network.getNetworkStateAsync();
    if (s.isConnected === false) return false;
    if (s.isInternetReachable === false) return false;
    return true;
  } catch {
    return true;
  }
}
