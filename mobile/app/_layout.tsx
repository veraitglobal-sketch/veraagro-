import { Stack } from 'expo-router';
import { CartProvider } from '../hooks/useCart';
import '../i18n/config';
import '../global.css';

// Mapbox initialization is done lazily in SuppliersMap component
// to avoid crashing if native module is not available

export default function RootLayout() {
  return (
    <CartProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2D5A27',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="map" options={{ headerShown: false }} />
        <Stack.Screen name="products" options={{ headerShown: false }} />
        <Stack.Screen name="product" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="partner-login" options={{ headerShown: false }} />
        <Stack.Screen name="buyer-login" options={{ headerShown: false }} />
        <Stack.Screen name="buyer-register" options={{ headerShown: false }} />
        <Stack.Screen name="(producer)" options={{ headerShown: false }} />
        <Stack.Screen name="(buyer)" options={{ headerShown: false }} />
      </Stack>
    </CartProvider>
  );
}
