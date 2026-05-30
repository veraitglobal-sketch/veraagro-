import 'react-native-gesture-handler';
import { LogBox } from 'react-native';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  authScreenNoSwipeBack,
  bioVeraStackScreenOptions,
  modalStackScreenOptions,
} from '../lib/stack-navigation-options';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { PushNotificationHandler } from '../components/PushNotificationHandler';
import { CartProvider } from '../hooks/useCart';
import '../i18n/config';
import { applySavedLanguagePreference } from '../lib/i18n-language';
import '../global.css';
import { syncService } from '../lib/sync-service';
import { BioVeraBoot } from '../shell/BioVeraBoot';
import { growerNavigationTheme } from '../shell/navigation-theme';

// RN 0.81+ deprecates built-in SafeAreaView; some deps still trigger this until they migrate.
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

/**
 * Expo Router’s Stack `screenOptions` types only allow a subset of header styles
 * (backgroundColor, etc.); we still want a thin border — cast avoids fighting the stub types.
 */
const stackHeaderStyle = growerNavigationTheme.headerStyle;

const stackHeaderTitleStyle = growerNavigationTheme.headerTitleStyle;

export default function RootLayout() {
  useEffect(() => {
    void applySavedLanguagePreference();
    void syncService.reconcileLegacyFieldLogQueueOnStartup();
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
    <AuthProvider>
    <BioVeraBoot>
    <PushNotificationHandler />
    <CartProvider>
      <Stack
        screenOptions={bioVeraStackScreenOptions({
          headerStyle: stackHeaderStyle as object,
          headerTintColor: growerNavigationTheme.headerTintColor,
          headerTitleStyle: stackHeaderTitleStyle as object,
        })}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="map" options={{ headerShown: false }} />
        <Stack.Screen name="b2b-supplier/[userId]" options={{ headerShown: false }} />
        <Stack.Screen name="b2b-thread/[threadId]" options={{ headerShown: false }} />
        <Stack.Screen name="supplier-map" options={{ headerShown: false }} />
        <Stack.Screen name="seed-registration" options={{ headerShown: false }} />
        <Stack.Screen name="scan-qr" options={{ headerShown: false, ...modalStackScreenOptions }} />
        <Stack.Screen name="products" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
        {/* Auth screens: no edge-swipe "back" — sign out only via Logout. */}
        <Stack.Screen
          name="login"
          options={{ headerShown: false, ...authScreenNoSwipeBack }}
        />
        <Stack.Screen
          name="partner-login"
          options={{ headerShown: false, ...authScreenNoSwipeBack }}
        />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen
          name="buyer-login"
          options={{ headerShown: false, ...authScreenNoSwipeBack }}
        />
        <Stack.Screen name="buyer-register" options={{ headerShown: false }} />
        {/* Authenticated hubs: allow native edge-swipe and stack gestures (inner navigators handle pop). */}
        <Stack.Screen
          name="(producer)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(buyer)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(supplier)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(logistics)"
          options={{ headerShown: false }}
        />
      </Stack>
    </CartProvider>
    </BioVeraBoot>
    </AuthProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
