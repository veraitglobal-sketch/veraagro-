import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../hooks/useCart';
import '../i18n/config';
import { applySavedLanguagePreference } from '../lib/i18n-language';
import '../global.css';
import { theme } from '../lib/theme';

/**
 * Expo Router’s Stack `screenOptions` types only allow a subset of header styles
 * (backgroundColor, etc.); we still want a thin border — cast avoids fighting the stub types.
 */
const stackHeaderStyle = {
  backgroundColor: theme.colors.background,
  borderBottomWidth: 1,
  borderBottomColor: theme.colors.border,
} as const;

const stackHeaderTitleStyle = {
  fontWeight: '300' as const,
  fontSize: 18,
  letterSpacing: -0.2,
} as const;

export default function RootLayout() {
  useEffect(() => {
    void applySavedLanguagePreference();
  }, []);
  return (
    <SafeAreaProvider>
    <AuthProvider>
    <CartProvider>
      <Stack
        screenOptions={{
          headerStyle: stackHeaderStyle as object,
          headerTintColor: theme.colors.text.primary,
          headerTitleStyle: stackHeaderTitleStyle as object,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="map" options={{ headerShown: false }} />
        <Stack.Screen name="b2b-supplier/[userId]" options={{ headerShown: false }} />
        <Stack.Screen name="b2b-thread/[threadId]" options={{ headerShown: false }} />
        <Stack.Screen name="supplier-map" options={{ headerShown: false }} />
        <Stack.Screen name="seed-registration" options={{ headerShown: false }} />
        <Stack.Screen name="scan-qr" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="products" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
        {/* Auth screens: no edge-swipe "back" — sign out only via Logout. */}
        <Stack.Screen
          name="login"
          options={{ headerShown: false, gestureEnabled: false, fullScreenGestureEnabled: false }}
        />
        <Stack.Screen
          name="partner-login"
          options={{ headerShown: false, gestureEnabled: false, fullScreenGestureEnabled: false }}
        />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen
          name="buyer-login"
          options={{ headerShown: false, gestureEnabled: false, fullScreenGestureEnabled: false }}
        />
        <Stack.Screen name="buyer-register" options={{ headerShown: false }} />
        <Stack.Screen
          name="(producer)"
          options={{ headerShown: false, gestureEnabled: false, fullScreenGestureEnabled: false }}
        />
        <Stack.Screen
          name="(buyer)"
          options={{ headerShown: false, gestureEnabled: false, fullScreenGestureEnabled: false }}
        />
        <Stack.Screen
          name="(supplier)"
          options={{ headerShown: false, gestureEnabled: false, fullScreenGestureEnabled: false }}
        />
        <Stack.Screen
          name="(logistics)"
          options={{ headerShown: false, gestureEnabled: false, fullScreenGestureEnabled: false }}
        />
      </Stack>
    </CartProvider>
    </AuthProvider>
    </SafeAreaProvider>
  );
}
