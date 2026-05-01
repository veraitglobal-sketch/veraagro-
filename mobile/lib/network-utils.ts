import * as Network from 'expo-network';

/**
 * True when the device can plausibly reach the internet.
 * On many Wi‑Fi networks Expo still reports `isInternetReachable === false` while browsing works;
 * we only treat **disconnected** interfaces as offline — not a bare `isInternetReachable: false`.
 */
export async function isDeviceOnline(): Promise<boolean> {
  try {
    const s = await Network.getNetworkStateAsync();
    if (s.isConnected === false) return false;
    if (s.isInternetReachable === true) return true;
    // Connected with unknown or “false” reachability: assume online (avoids false “offline” on WLAN).
    return s.isConnected === true;
  } catch {
    return true;
  }
}
