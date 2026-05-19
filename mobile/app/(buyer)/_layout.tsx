import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthGuard } from '../../components/AuthGuard';
import { bioVeraStackScreenOptions } from '../../lib/stack-navigation-options';

/**
 * Buyer: Stack over tabs so cart / checkout / order detail support edge-swipe back.
 */
export default function BuyerLayout() {
  const { t } = useTranslation();

  return (
    <AuthGuard requiredRole={['BUYER', 'CUSTOMER']}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={bioVeraStackScreenOptions({ headerShown: false })}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="cart" options={{ title: t('buyer.tabs.cart') }} />
          <Stack.Screen name="checkout" options={{ title: t('buyer.tabs.checkout') }} />
          <Stack.Screen name="order/[id]" options={{ title: t('buyer.tabs.orderTracking') }} />
          <Stack.Screen name="notifications" />
        </Stack>
      </View>
    </AuthGuard>
  );
}
