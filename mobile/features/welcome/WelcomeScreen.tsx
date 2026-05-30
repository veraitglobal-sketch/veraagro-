import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthScreenShell } from '../../components/auth/AuthScreenShell';
import { AuthBrandHero } from '../../components/auth/AuthBrandHero';
import WelcomeActions from '../../components/auth/WelcomeActions';
import { EnterprisePanel } from '../../design-system';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';
import { useAuth } from '../../hooks/useAuth';
import { getPostLoginPath, normalizeUserRoles, partnerSignInHref } from '../../lib/post-login-redirect';

const ENTER_ACTIONS = FadeInUp.delay(180).duration(520).springify().damping(22);

/**
 * Welcome — editorial brand hero + premium CTA panel (login form stays separate).
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

  const footer = (
    <Text style={styles.footer}>{t('producer.brand.ribbonSub')}</Text>
  );

  return (
    <SafeAreaView style={enterpriseUi.authCanvas} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <AuthScreenShell footer={footer} contentStyle={styles.shell}>
        <AuthBrandHero />

        <Animated.View entering={ENTER_ACTIONS} style={styles.actions}>
          <EnterprisePanel variant="premium" padding="lg">
            <WelcomeActions
              loginLabel={t('growerJourney.ctaLogIn')}
              registerLabel={t('growerJourney.ctaRegister')}
              onLogin={() => router.push(loginHref)}
              onRegister={() => router.push('/register')}
            />
          </EnterprisePanel>
        </Animated.View>
      </AuthScreenShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shell: {
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  actions: {
    width: '100%',
    paddingBottom: 4,
  },
  footer: {
    fontSize: 13,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: -0.05,
    maxWidth: 300,
  },
});
