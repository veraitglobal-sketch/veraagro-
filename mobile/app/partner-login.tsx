import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { getPostLoginPath, normalizeUserRoles, type PartnerEntryRedirect } from '../lib/post-login-redirect';
import { theme } from '../lib/theme';

/**
 * Producer Login Screen
 * Exclusive entry point for farmers/producers
 * Uses PartnerCode authentication
 */
export default function PartnerLoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ redirect?: string }>();
  const { login, logout } = useAuth();
  const [username, setUsername] = useState(''); // Can be email or partnerCode
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(t('error'), t('partnerLogin.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const response = await login(username, password);
      const userRoles = normalizeUserRoles(response.user);
      const rawRedirect = params.redirect;
      const redirectParam = Array.isArray(rawRedirect) ? rawRedirect[0] : rawRedirect;
      const partnerEntry: PartnerEntryRedirect =
        redirectParam === 'estates/new' || redirectParam === 'estates' ? redirectParam : undefined;
      const path = getPostLoginPath(userRoles, { partnerEntry });

      if (path) {
        router.replace(path as any);
      } else {
        Alert.alert(t('error'), t('partnerLogin.notProducerAccess'));
        await logout();
      }
    } catch (error: any) {
      Alert.alert(t('error'), error?.message || t('partnerLogin.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.primary, justifyContent: 'center', padding: theme.spacing.xl }}>
      {/* Header */}
      <View style={{ marginBottom: theme.spacing.xl, alignItems: 'center' }}>
        <Text style={{
          fontSize: 24,
          fontWeight: '300',
          color: theme.colors.text.inverse,
          marginBottom: theme.spacing.sm,
          letterSpacing: 2,
        }}>
          Bio Vera
        </Text>
        <Text style={{
          fontSize: 13,
          fontWeight: '300',
          color: 'rgba(255, 255, 255, 0.8)',
          letterSpacing: 0.5,
        }}>
          {t('partnerLogin.subtitle')}
        </Text>
      </View>

      {/* Login Form */}
      <View style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: theme.spacing.lg,
      }}>
        <Text style={{
          fontSize: 11,
          fontWeight: '500',
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          {t('partnerLogin.username')}
        </Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder={t('partnerLogin.usernamePlaceholder')}
          placeholderTextColor={theme.colors.text.tertiary}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            fontSize: 14,
            fontWeight: '300',
            color: theme.colors.text.primary,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.md,
            borderBottomWidth: 0.5,
            borderBottomColor: 'rgba(0, 0, 0, 0.1)',
            marginBottom: theme.spacing.lg,
            letterSpacing: 0.3,
          }}
        />

        <Text style={{
          fontSize: 11,
          fontWeight: '500',
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          {t('partnerLogin.password')}
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={t('partnerLogin.passwordPlaceholder')}
          placeholderTextColor={theme.colors.text.tertiary}
          secureTextEntry
          style={{
            fontSize: 14,
            fontWeight: '300',
            color: theme.colors.text.primary,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.md,
            borderBottomWidth: 0.5,
            borderBottomColor: 'rgba(0, 0, 0, 0.1)',
            marginBottom: theme.spacing.lg,
            letterSpacing: 0.3,
          }}
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: theme.colors.primary,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.borderRadius.md,
            alignItems: 'center',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.text.inverse} />
          ) : (
            <Text style={{
              fontSize: 14,
              fontWeight: '300',
              color: theme.colors.text.inverse,
              letterSpacing: 1,
            }}>
              {t('partnerLogin.button')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* After replace() from logout there is no stack to pop — use replace, not back() */}
      <TouchableOpacity
        onPress={() => router.replace('/')}
        style={{ alignItems: 'center' }}
      >
        <Text style={{
          fontSize: 12,
          fontWeight: '300',
          color: 'rgba(255, 255, 255, 0.8)',
          letterSpacing: 0.5,
        }}>
          {t('partnerLogin.backToMarketplaceFull')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
