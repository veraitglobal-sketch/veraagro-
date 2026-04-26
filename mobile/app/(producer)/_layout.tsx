import { View } from 'react-native';
import { Stack } from 'expo-router';
import { AuthGuard } from '../../components/AuthGuard';

/**
 * Producer Layout
 * Wraps producer routes with authentication
 */
export default function ProducerLayout() {
  return (
    <AuthGuard requiredRole={['ADMIN', 'FARMER', 'PARTNER', 'GROWER']}>
      <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="scanner" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Scan Barcode',
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
        <Stack.Screen name="mission/[id]" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="compliance-photos" />
        <Stack.Screen name="quality-entry" />
        <Stack.Screen name="materials" />
        <Stack.Screen name="growth-journal" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="vera-bag" />
        <Stack.Screen name="vera-insights" />
        <Stack.Screen name="plot-mapper" />
        <Stack.Screen name="packing-flow" options={{ title: 'Packing Flow' }} />
      </Stack>
      </View>
    </AuthGuard>
  );
}
