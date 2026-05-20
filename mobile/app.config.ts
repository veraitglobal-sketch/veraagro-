import type { ExpoConfig } from 'expo/config';
import appJson from './app.json';

const base = appJson.expo as ExpoConfig;

/**
 * Dynamic Expo config: Firebase client files (gitignored) are wired for EAS/prebuild.
 * Copy google-services.json.example → google-services.json after Firebase Console setup.
 */
export default (): ExpoConfig => ({
  ...base,
  owner: 'biovera',
  ios: {
    ...base.ios,
    googleServicesFile: './GoogleService-Info.plist',
    infoPlist: {
      ...(base.ios?.infoPlist as Record<string, unknown> | undefined),
      UIBackgroundModes: ['remote-notification'],
    },
  },
  android: {
    ...base.android,
    googleServicesFile: './google-services.json',
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
