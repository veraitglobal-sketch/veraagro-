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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Leaf, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { getPostLoginPath, normalizeUserRoles } from '../lib/post-login-redirect';
import { theme } from '../lib/theme';

/**
 * Universal login — role after sign-in. Polished full-screen experience with depth, clear fields, and keyboard-safe layout.
 */
export default function LoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, logout } = useAuth();
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
      const path = getPostLoginPath(normalizeUserRoles(response.user));
      if (path) {
        router.replace(path as any);
      } else {
        await logout();
        Alert.alert(t('error'), t('login.noRoleForApp'));
        return;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t('login.failed');
      Alert.alert(t('error'), msg || t('login.failed'));
    } finally {
      setLoading(false);
    }
  }, [username, password, login, logout, router, t]);

  return (
    <LinearGradient
      colors={['#2f6b32', '#1e4a24', '#152e1a']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.gradient}
    >
      <View style={[StyleSheet.absoluteFill, styles.ambient]} pointerEvents="none">
        <View style={styles.orb1} />
        <View style={styles.orb2} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => router.replace('/')}
            style={[styles.backRow, { marginTop: 4 }]}
            hitSlop={12}
            accessibilityLabel={t('common.back')}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color="rgba(255,255,255,0.85)" strokeWidth={2} />
            <Text style={styles.backText}>{t('common.back')}</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.logoRing}>
              <View style={styles.logoInner}>
                <Leaf size={32} color="#2D5A27" strokeWidth={1.5} />
              </View>
            </View>
            <Text style={styles.brand} accessibilityRole="header">
              Bio Vera
            </Text>
            <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardInner}>
              <Text style={styles.label}>{t('login.username')}</Text>
              <Text style={styles.hint}>{t('login.usernameHelper')}</Text>
              <View style={[styles.inputWrap, userFocused && styles.inputWrapFocused]}>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder={t('login.usernamePlaceholder')}
                  placeholderTextColor={theme.colors.text.tertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    // focus password — handled by user tapping
                  }}
                  onFocus={() => setUserFocused(true)}
                  onBlur={() => setUserFocused(false)}
                  style={styles.inputInCard}
                />
              </View>

              <Text style={[styles.label, { marginTop: 18 }]}>{t('login.password')}</Text>
              <View style={[styles.inputWrap, styles.inputRow, passFocused && styles.inputWrapFocused]}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('login.passwordPlaceholder')}
                  placeholderTextColor={theme.colors.text.tertiary}
                  secureTextEntry={!showPassword}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  style={styles.inputInCardFlex}
                />
                <Pressable
                  onPress={() => setShowPassword((s) => !s)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                >
                  {showPassword ? (
                    <EyeOff size={22} color={theme.colors.text.secondary} strokeWidth={1.5} />
                  ) : (
                    <Eye size={22} color={theme.colors.text.secondary} strokeWidth={1.5} />
                  )}
                </Pressable>
              </View>

              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={({ pressed }) => [
                  styles.button,
                  loading && styles.buttonDisabled,
                  pressed && !loading && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ busy: loading }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{t('login.button')}</Text>
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.push('/buyer-register')} activeOpacity={0.75} style={styles.footerBtn}>
              <Text style={styles.linkStrong}>{t('login.registerBuyer')}</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity onPress={() => router.replace('/')} activeOpacity={0.75} style={styles.footerBtn}>
              <Text style={styles.linkMuted}>{t('login.backToMarketplace')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  ambient: {
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    top: '8%',
    right: '-8%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  orb2: {
    position: 'absolute',
    bottom: '20%',
    left: '-12%',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 2,
  },
  backText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginBottom: 16,
  },
  logoInner: {
    flex: 1,
    borderRadius: 42,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },
  brand: {
    fontSize: 32,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.88)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    ...theme.shadows.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  cardInner: {
    padding: theme.spacing.lg,
    paddingVertical: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    letterSpacing: -0.2,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: 2,
    marginBottom: 8,
  },
  inputWrap: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  inputWrapFocused: {
    borderColor: 'rgba(45, 90, 39, 0.5)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputInCard: {
    fontSize: 16,
    color: theme.colors.text.primary,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputInCardFlex: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  eyeBtn: {
    paddingRight: 12,
    paddingVertical: 8,
  },
  button: {
    backgroundColor: theme.colors.primary,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.2,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerBtn: {
    paddingVertical: 6,
  },
  linkStrong: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    textDecorationLine: 'underline',
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 12,
  },
  linkMuted: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
});
