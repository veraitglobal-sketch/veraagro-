import { Stack } from 'expo-router';
import { theme } from '../../lib/theme';

/** Material supplier (B2B store): grower orders + message threads */
export default function SupplierLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: { fontWeight: '300' as const, fontSize: 17 },
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Partner store' }} />
      <Stack.Screen name="orders" options={{ title: 'Orders' }} />
      <Stack.Screen name="messages" options={{ title: 'Messages' }} />
    </Stack>
  );
}
