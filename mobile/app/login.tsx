import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react-native';
import { AuthPanel, AuthScreenShell } from '../components/auth/AuthScreenShell';
import { enterpriseColors, enterpriseUi } from '../lib/enterprise-ui';
import { useAuth } from '../hooks/useAuth';
import {
  getPostLoginPath,
  normalizeUserRoles,
  type PartnerEntryRedirect,
} from '../lib/post-login-redirect';
import { theme } from '../lib/theme';

/** Login — same enterprise shell as welcome (gray-50, white panel, Vera primary CTA). */
export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const rawParams = useLocalSearchParams<{ redirect?: string | string[]; partner?: string | string[] }>();
  const { login, logout } = useAuth();

  const partnerMode = (() => {
    const p = rawParams.partner;
    const v = Array.isArray(p) ? p[0] : p;
    return v === '1' || v === 'true' || v === 'yes';
  })();
  const redirectParam = (() => {
    const r = rawParams.redirect;
    return Array.isArray(r) ? r[0] : r;
  })();
  const partnerEntry: PartnerEntryRedirect =
    partnerMode && (redirectParam === 'estates/new' || redirectParam === 'estates') ? redirectParam : undefined;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userFocused, setUserFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!username?.trim() || !password) {
      Alert.alert(t('error'), t('login.fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      const response = await login(username.trim(), password);
      const path = getPostLoginPath(normalizeUserRoles(response.user), { partnerEntry });
      if (path) {
        router.replace(path as Href);
      } else {
        await logout();
        Alert.alert(t('error'), partnerMode ? t('partnerLogin.notProducerAccess') : t('login.noRoleForApp'));
      }
    } catch (error: unknown) {
      const code = error && typeof error === 'object' && 'code' in error ? (error as { code?: string }).code : undefined;
      if (code === 'ACCOUNT_PENDING_APPROVAL') {
        Alert.alert(t('error'), t('login.pendingApproval'));
        return;
      }
      const msg = error instanceof Error ? error.message : t('login.failed');
      Alert.alert(t('error'), msg || t('login.failed'));
    } finally {
      setLoading(false);
    }
  }, [username, password, login, logout, router, t, partnerEntry, partnerMode]);

  const footer = (
    <View style={styles.footer}>
      {!partnerMode ? (
        <TouchableOpacity
          onPress={() => router.push('/buyer-register')}
          activeOpacity={0.7}
          style={styles.footerBtn}
        >
          <Text style={styles.footerAccent}>{t('login.registerBuyer')}</Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity onPress={() => router.replace('/')} activeOpacity={0.7} style={styles.footerBtn}>
        <Text style={styles.footerMuted}>
          {partnerMode ? t('partnerLogin.backToMarketplaceFull') : t('login.backToMarketplace')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={enterpriseUi.authCanvas} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <AuthScreenShell footer={footer}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                onPress={() => router.replace('/')}
                style={styles.backRow}
                hitSlop={12}
                accessibilityLabel={t('common.back')}
                activeOpacity={0.7}
              >
                <ChevronLeft size={20} color={enterpriseColors.gray600} strokeWidth={1.75} />
                <Text style={styles.backText}>{t('common.back')}</Text>
              </TouchableOpacity>

              <AuthPanel>
                <View style={enterpriseUi.authPanelHeader}>
                  <View style={enterpriseUi.authRule} />
                  <Text style={enterpriseUi.authTitle} accessibilityRole="header">
                    {partnerMode ? t('partnerLogin.title') : t('login.title')}
                  </Text>
                  <Text style={enterpriseUi.authSubtitle}>
                    {partnerMode ? t('partnerLogin.subtitle') : t('login.subtitle')}
                  </Text>
                </View>

                <Text style={enterpriseUi.authLabel}>
                  {partnerMode ? t('partnerLogin.username') : t('login.username')}
                </Text>
                {!partnerMode ? <Text style={enterpriseUi.authHint}>{t('login.usernameHelper')}</Text> : null}
                <View style={[enterpriseUi.authInput, userFocused && enterpriseUi.authInputFocused]}>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder={
                      partnerMode ? t('partnerLogin.usernamePlaceholder') : t('login.usernamePlaceholder')
                    }
                    placeholderTextColor={theme.colors.text.tertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="next"
                    onFocus={() => setUserFocused(true)}
                    onBlur={() => setUserFocused(false)}
                    style={styles.input}
                  />
                </View>

                <Text style={[enterpriseUi.authLabel, enterpriseUi.authFieldGap]}>
                  {partnerMode ? t('partnerLogin.password') : t('login.password')}
                </Text>
                <View
                  style={[
                    enterpriseUi.authInput,
                    styles.inputRow,
                    passFocused && enterpriseUi.authInputFocused,
                  ]}
                >
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={
                      partnerMode ? t('partnerLogin.passwordPlaceholder') : t('login.passwordPlaceholder')
                    }
                    placeholderTextColor={theme.colors.text.tertiary}
                    secureTextEntry={!showPassword}
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                    style={styles.inputFlex}
                  />
                  <Pressable
                    onPress={() => setShowPassword((s) => !s)}
                    style={styles.eyeBtn}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={enterpriseColors.gray600} strokeWidth={1.75} />
                    ) : (
                      <Eye size={20} color={enterpriseColors.gray600} strokeWidth={1.75} />
                    )}
                  </Pressable>
                </View>

                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.9}
                  style={[enterpriseUi.authSubmit, loading && styles.submitDisabled]}
                  accessibilityRole="button"
                  accessibilityState={{ busy: loading }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={enterpriseUi.authSubmitText}>
                      {partnerMode ? t('partnerLogin.button') : t('login.button')}
                    </Text>
                  )}
                </TouchableOpacity>
              </AuthPanel>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </AuthScreenShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
    gap: 2,
  },
  backText: {
    fontSize: 15,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    letterSpacing: -0.1,
  },
  input: {
    fontSize: 16,
    color: theme.colors.text.primary,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 48,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputFlex: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 48,
  },
  eyeBtn: {
    paddingRight: 12,
    paddingVertical: 8,
  },
  submitDisabled: {
    opacity: 0.65,
  },
  footer: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  footerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  footerAccent: {
    fontSize: 14,
    fontWeight: '500',
    color: enterpriseColors.primary,
    textAlign: 'center',
  },
  footerMuted: {
    fontSize: 14,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    textAlign: 'center',
  },
});
