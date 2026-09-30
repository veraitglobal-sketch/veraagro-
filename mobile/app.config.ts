import fs from 'fs';
import path from 'path';
import type { ExpoConfig } from 'expo/config';
import appJson from './app.json';

const base = appJson.expo as ExpoConfig;

function firstExistingFile(...candidates: string[]): string | undefined {
  for (const rel of candidates) {
    if (fs.existsSync(path.join(__dirname, rel))) return rel;
  }
  return undefined;
}

const iosGoogleServices = firstExistingFile(
  'GoogleService-Info.plist',
  'GoogleService-Info.plist.example',
);
const androidGoogleServices = firstExistingFile('google-services.json', 'google-services.json.example');

/**
 * Dynamic Expo config: Firebase client files (gitignored) are wired for EAS/prebuild.
 * Copy google-services.json.example → google-services.json after Firebase Console setup.
 */
export default (): ExpoConfig => ({
  ...base,
  // owner: 'biovera' — set only when your Expo user is a member of @biovera org
  ios: {
    ...base.ios,
    ...(iosGoogleServices ? { googleServicesFile: iosGoogleServices } : {}),
    infoPlist: {
      ...(base.ios?.infoPlist as Record<string, unknown> | undefined),
      UIBackgroundModes: ['remote-notification'],
    },
  },
  android: {
    ...base.android,
    ...(androidGoogleServices ? { googleServicesFile: androidGoogleServices } : {}),
  },
  plugins: [
    ...(base.plugins ?? []).filter(
      (p) =>
        p !== 'expo-notifications' &&
        p !== '@react-native-community/datetimepicker' &&
        !(Array.isArray(p) && (p[0] === 'expo-notifications' || p[0] === '@react-native-community/datetimepicker')),
    ),
    '@react-native-community/datetimepicker',
    [
      'expo-notifications',
      {
        color: '#2D5A27',
        defaultChannel: 'default',
        enableBackgroundRemoteNotifications: true,
      },
    ],
  ],
});
