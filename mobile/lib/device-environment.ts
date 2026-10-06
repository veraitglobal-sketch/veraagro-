import * as Device from 'expo-device';

/** True on iOS Simulator / Android emulator — GPS coordinates are not field-accurate. */
export function isSimulatedDevice(): boolean {
  return !Device.isDevice;
}
