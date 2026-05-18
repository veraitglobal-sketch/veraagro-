import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import WelcomeActions from '../../components/auth/WelcomeActions';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';
import { useAuth } from '../../hooks/useAuth';
import { getPostLoginPath, normalizeUserRoles, partnerSignInHref } from '../../lib/post-login-redirect';

const LOGO = require('../../assets/logo.png');

const ENTER_LOGO = FadeIn.duration(600);
const ENTER_TAGLINE = FadeInDown.delay(100).duration(550).springify().damping(24);

/**
 * Enterprise welcome — gray-50 canvas, light type, web-style primary + outline CTAs.
 */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const redirectTarget = useMemo(() => {
    if (authLoading || !user) return null;
    return getPostLoginPath(normalizeUserRoles(user));
  }, [user, authLoading]);

  useEffect(() => {
    if (!redirectTarget) return;
    router.replace(redirectTarget);
  }, [redirectTarget, router]);

  const loginHref = partnerSignInHref() as Href;

  if (authLoading || redirectTarget) {
    return (
      <SafeAreaView style={[enterpriseUi.authCanvas, styles.centered]} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={enterpriseColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={enterpriseUi.authCanvas} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <LinearGradient
        colors={['rgba(45, 90, 39, 0.08)', 'rgba(249, 250, 251, 0)']}
        style={styles.gradient}
        pointerEvents="none"
      />

      <View style={styles.hero}>
        <Animated.View entering={ENTER_LOGO}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="Bio Vera" />
        </Animated.View>

        <Animated.View entering={ENTER_TAGLINE} style={styles.tagline}>
          <View style={enterpriseUi.authRule} />
          <Text style={enterpriseUi.authTaglineLine}>{t('growerJourney.taglineLine1')}</Text>
          <Text style={[enterpriseUi.authTaglineAccent, styles.taglineSecond]}>
            {t('growerJourney.taglineLine2')}
          </Text>
        </Animated.View>
      </View>

      <View style={styles.actions}>
        <WelcomeActions
          loginLabel={t('growerJourney.ctaLogIn')}
          registerLabel={t('growerJourney.ctaRegister')}
          onLogin={() => router.push(loginHref)}
          onRegister={() => router.push('/register')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 160,
    height: 46,
    marginBottom: 36,
  },
  tagline: {
    alignItems: 'center',
    maxWidth: 300,
  },
  taglineSecond: {
    marginTop: 0,
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 4,
  },
});
