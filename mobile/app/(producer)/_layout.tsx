import { View } from 'react-native';
import { Stack } from 'expo-router';
import i18n from '../../i18n/config';
import { AuthGuard } from '../../components/AuthGuard';
import { NetworkProvider } from '../../contexts/NetworkContext';
import { ProducerOfflineStrip } from '../../components/ProducerOfflineStrip';

/**
 * Producer Layout
 * Wraps producer routes with authentication
 */
export default function ProducerLayout() {
  return (
    <AuthGuard requiredRole={['ADMIN', 'FARMER', 'PARTNER', 'GROWER']}>
      <NetworkProvider>
      <View style={{ flex: 1 }}>
        <ProducerOfflineStrip />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="scanner"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: i18n.t('navigation.scanBarcode'),
          }}
        />
        <Stack.Screen name="field-season" />
        <Stack.Screen name="estates" />
        <Stack.Screen name="estates/new" />
        <Stack.Screen name="estates/[id]" />
        <Stack.Screen name="estates/[id]/edit" />
        <Stack.Screen name="batches" />
        <Stack.Screen name="batch/[id]" />
        <Stack.Screen name="missions" />
        <Stack.Screen name="missions-create" options={{ title: i18n.t('navigation.requestTransport') }} />
        <Stack.Screen name="mission/[id]" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="compliance-photos" />
        <Stack.Screen name="quality-entry" />
        <Stack.Screen name="materials" />
        <Stack.Screen name="growth-journal" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen
          name="partner-orders"
          options={{
            headerShown: true,
            title: i18n.t('navigation.partnerOrders'),
            headerBackTitle: i18n.t('common.back'),
          }}
        />
        <Stack.Screen name="vera-bag" />
        <Stack.Screen name="vera-insights" />
        <Stack.Screen name="plot-mapper" />
        <Stack.Screen name="packing-flow" options={{ title: i18n.t('navigation.packingFlow') }} />
        <Stack.Screen name="package-badges" options={{ title: i18n.t('navigation.packageBadges') }} />
        <Stack.Screen name="package-badges-print-order" />
      </Stack>
      </View>
      </NetworkProvider>
    </AuthGuard>
  );
}
