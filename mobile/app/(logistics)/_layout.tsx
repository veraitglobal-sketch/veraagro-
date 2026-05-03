import { View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { AuthGuard } from '../../components/AuthGuard';

/**
 * Driver / cold-chain: missions assigned to you + PENDING pool (no dedicated web-only requirement).
 * Users with GROWER + LOGISTICS use the producer app; pure LOGISTICS land here.
 */
export default function LogisticsLayout() {
  return (
    <AuthGuard requiredRole={['LOGISTICS_PARTNER']}>
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            ...(Platform.OS === 'ios' ? { fullScreenGestureEnabled: true } : {}),
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="mission/[id]" />
          <Stack.Screen name="handover-receiver" />
        </Stack>
      </View>
    </AuthGuard>
  );
}
