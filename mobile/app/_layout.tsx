import { Stack } from 'expo-router';
import { CartProvider } from '../hooks/useCart';
import '../i18n/config';
import '../global.css';
import { theme } from '../lib/theme';

export default function RootLayout() {
  return (
    <CartProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          },
          headerTintColor: theme.colors.text.primary,
          headerTitleStyle: {
            fontWeight: '300',
            fontSize: 18,
            letterSpacing: -0.2,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="map" options={{ headerShown: false }} />
        <Stack.Screen name="supplier-map" options={{ headerShown: false }} />
        <Stack.Screen name="seed-registration" options={{ headerShown: false }} />
        <Stack.Screen name="scan-qr" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="products" options={{ headerShown: false }} />
        <Stack.Screen name="product" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="partner-login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="buyer-login" options={{ headerShown: false }} />
        <Stack.Screen name="buyer-register" options={{ headerShown: false }} />
        <Stack.Screen name="(producer)" options={{ headerShown: false }} />
        <Stack.Screen name="(buyer)" options={{ headerShown: false }} />
      </Stack>
    </CartProvider>
  );
}
