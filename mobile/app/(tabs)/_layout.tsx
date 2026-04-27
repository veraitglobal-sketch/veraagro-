import { Stack } from 'expo-router';
import i18n from '../../i18n/config';
import { theme } from '../../lib/theme';

/**
 * Legacy / minimal shell: only the dashboard is implemented here; grower and buyer flows
 * live in (producer) and (buyer). Avoid declaring tabs for routes that have no files.
 */
export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: { fontWeight: '300' as const, fontSize: 18 },
        headerShadowVisible: true,
        headerLargeTitle: false,
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: i18n.t('navigation.appName') }} />
    </Stack>
  );
}
