import { View } from 'react-native';
import { Stack } from 'expo-router';
import { AuthGuard } from '../../components/AuthGuard';
import { bioVeraStackScreenOptions } from '../../lib/stack-navigation-options';

/**
 * Driver / cold-chain: missions assigned to you + PENDING pool (no dedicated web-only requirement).
 * Users with GROWER + LOGISTICS use the producer app; pure LOGISTICS land here.
 */
export default function LogisticsLayout() {
  return (
    <AuthGuard requiredRole={['LOGISTICS_PARTNER']}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={bioVeraStackScreenOptions({ headerShown: false })}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="vehicles" />
          <Stack.Screen name="drivers" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="mission/[id]" />
          <Stack.Screen name="handover-receiver" />
          <Stack.Screen name="handover-loading" />
        </Stack>
      </View>
    </AuthGuard>
  );
}
