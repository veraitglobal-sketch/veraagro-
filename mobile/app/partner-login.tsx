import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../lib/theme';
import { partnerSignInHref } from '../lib/post-login-redirect';

/**
 * Legacy route — forwards to universal `/login` with producer deep-link flags.
 * Keeps deep links and bookmarks working; all UI lives in `login.tsx`.
 */
export default function PartnerLoginScreen() {
  const router = useRouter();
  const raw = useLocalSearchParams<{ redirect?: string | string[] }>();
  const redirectRaw = Array.isArray(raw.redirect) ? raw.redirect[0] : raw.redirect;
  const redirect =
    redirectRaw === 'estates/new' || redirectRaw === 'estates' ? redirectRaw : undefined;

  useEffect(() => {
    router.replace(partnerSignInHref(redirect) as any);
  }, [router, redirect]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
      }}
    >
      <ActivityIndicator color="rgba(255,255,255,0.9)" size="large" />
    </View>
  );
}
