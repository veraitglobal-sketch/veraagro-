import { View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import i18n from '../../i18n/config';
import { AuthGuard } from '../../components/AuthGuard';
import { NetworkProvider } from '../../contexts/NetworkContext';
import { ProducerOfflineStrip } from '../../components/ProducerOfflineStrip';
import { GrowerReconnectAutoSync } from '../../components/GrowerReconnectAutoSync';
import { GrowerDashboardProvider } from '../../contexts/GrowerDashboardContext';

/**
 * Producer Layout
 * Wraps producer routes with authentication
 */
export default function ProducerLayout() {
  return (
    <AuthGuard requiredRole={['ADMIN', 'FARMER', 'PARTNER', 'GROWER']}>
      <NetworkProvider>
      <GrowerDashboardProvider>
      <View style={{ flex: 1 }}>
        <GrowerReconnectAutoSync />
        <ProducerOfflineStrip />
      <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          ...(Platform.OS === 'ios' ? { fullScreenGestureEnabled: true } : {}),
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="scanner"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: i18n.t('navigation.scanBarcode'),
          }}
        />
        <Stack.Screen name="estates" />
        <Stack.Screen name="estates/new" />
        <Stack.Screen name="estates/[id]" />
        <Stack.Screen name="estates/[id]/edit" />
        <Stack.Screen name="batches" />
        <Stack.Screen name="batch-new" />
        <Stack.Screen name="batch/[id]" />
        <Stack.Screen name="missions" />
        <Stack.Screen name="missions-create" options={{ title: i18n.t('navigation.requestTransport') }} />
        <Stack.Screen name="mission/[id]" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="compliance-photos" />
        <Stack.Screen
          name="education"
          options={{
            headerShown: true,
            title: i18n.t('producer.education.screenTitle'),
            headerBackTitle: i18n.t('common.back'),
          }}
        />
        <Stack.Screen name="quality-entry" />
        <Stack.Screen name="materials" />
        <Stack.Screen name="growth-journal" />
        <Stack.Screen name="plantings" options={{ headerShown: false }} />
        <Stack.Screen name="partner-orders" options={{ headerShown: false }} />
        <Stack.Screen name="partner-order/[orderId]" options={{ headerShown: false }} />
        <Stack.Screen name="vera-bag" />
        <Stack.Screen name="vera-insights" />
        <Stack.Screen name="plot-mapper" />
        <Stack.Screen name="packing-flow" options={{ title: i18n.t('navigation.packingFlow') }} />
        <Stack.Screen name="package-badges" options={{ title: i18n.t('navigation.packageBadges') }} />
        <Stack.Screen name="package-badges-print-order" />
        <Stack.Screen
          name="farm-tools"
          options={{
            headerShown: true,
            title: i18n.t('producer.dashboard.farmToolsTitle'),
            headerBackTitle: i18n.t('common.back'),
          }}
        />
      </Stack>
      </View>
      </View>
      </GrowerDashboardProvider>
      </NetworkProvider>
    </AuthGuard>
  );
}
