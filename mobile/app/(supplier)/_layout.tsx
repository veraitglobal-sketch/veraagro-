import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AuthGuard } from '../../components/AuthGuard';
import { theme } from '../../lib/theme';

/** Material supplier (B2B): grower orders + message threads. Requires MATERIAL_SUPPLIER on the account. */
export default function SupplierLayout() {
  const { t } = useTranslation();
  return (
    <AuthGuard requiredRole={['MATERIAL_SUPPLIER']}>
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text.primary,
            headerTitleStyle: { fontWeight: '300' as const, fontSize: 17 },
            headerShadowVisible: true,
          }}
        >
          <Stack.Screen name="dashboard" options={{ title: t('supplier.partnerStore') }} />
          <Stack.Screen name="orders" options={{ title: t('supplier.screenOrders') }} />
          <Stack.Screen name="messages" options={{ title: t('supplier.screenMessages') }} />
        </Stack>
      </View>
    </AuthGuard>
  );
}
