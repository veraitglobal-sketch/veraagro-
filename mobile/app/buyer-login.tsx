import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../lib/theme';

/**
 * Buyer Login Screen
 * For customers who want to purchase products
 * Supports Email, Google, or Guest access
 */
export default function BuyerLoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login, logout } = useAuth();
  const [username, setUsername] = useState(''); // Can be email or partnerCode
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(t('error') || 'Error', t('buyerLogin.fillAllFields') || 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await login(username, password);
      
      // Check if user has BUYER role or allow any role for buyer portal
      const userRoles = response.user.roles || (response.user.role ? [response.user.role] : []);
      const isBuyer = userRoles.includes('BUYER') || userRoles.includes('CUSTOMER');
      
      if (isBuyer || userRoles.length === 0) {
        // Navigate to buyer dashboard
        router.replace('/(buyer)/shop');
      } else {
        Alert.alert(
          t('error') || 'Error',
          t('buyerLogin.notBuyer') || 'This account is not authorized for buyer access'
        );
        await logout();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        t('error') || 'Error',
        error.message || t('buyerLogin.failed') || 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    Alert.alert(t('info'), t('buyerLogin.googleComingSoon'));
  };

  const handleGuestAccess = () => {
    router.replace('/(buyer)/shop');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', padding: theme.spacing.xl }}>
      {/* Header */}
      <View style={{ marginBottom: theme.spacing.xl, alignItems: 'center' }}>
        <Text style={{
          fontSize: 28,
          fontWeight: '300',
          color: theme.colors.primary,
          marginBottom: theme.spacing.sm,
          letterSpacing: 2,
        }}>
          Bio Vera Marketplace
        </Text>
        <Text style={{
          fontSize: 13,
          fontWeight: '300',
          color: theme.colors.text.secondary,
          letterSpacing: 0.5,
        }}>
          {t('buyerLogin.subtitle') || 'Sign in to purchase organic products'}
        </Text>
      </View>

      {/* Login Form */}
      <View style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        borderWidth: 0.5,
        borderColor: 'rgba(0, 0, 0, 0.1)',
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
          {t('buyerLogin.username') || 'Username / Email / Partner Code'}
        </Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder={t('buyerLogin.usernamePlaceholder') || 'Enter username, email or partner code'}
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
          {t('buyerLogin.password') || 'Password'}
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={t('buyerLogin.password') || 'Enter password'}
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
              {t('buyerLogin.login') || 'Sign In'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: theme.spacing.lg,
      }}>
        <View style={{ flex: 1, height: 0.5, backgroundColor: 'rgba(0, 0, 0, 0.1)' }} />
        <Text style={{
          marginHorizontal: theme.spacing.md,
          fontSize: 11,
          fontWeight: '300',
          color: theme.colors.text.secondary,
          letterSpacing: 1,
        }}>
          {t('buyerLogin.or') || 'OR'}
        </Text>
        <View style={{ flex: 1, height: 0.5, backgroundColor: 'rgba(0, 0, 0, 0.1)' }} />
      </View>

      {/* Google Login */}
      <TouchableOpacity
        onPress={handleGoogleLogin}
        style={{
          backgroundColor: theme.colors.surface,
          borderWidth: 0.5,
          borderColor: 'rgba(0, 0, 0, 0.1)',
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.borderRadius.md,
          alignItems: 'center',
          marginBottom: theme.spacing.md,
        }}
      >
        <Text style={{
          fontSize: 14,
          fontWeight: '300',
          color: theme.colors.text.primary,
          letterSpacing: 0.5,
        }}>
          {t('buyerLogin.googleLogin') || 'Continue with Google'}
        </Text>
      </TouchableOpacity>

      {/* Guest Access */}
      <TouchableOpacity
        onPress={handleGuestAccess}
        style={{
          backgroundColor: theme.colors.surface,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.borderRadius.md,
          alignItems: 'center',
          borderWidth: 0.5,
          borderColor: 'rgba(0, 0, 0, 0.05)',
        }}
      >
        <Text style={{
          fontSize: 13,
          fontWeight: '300',
          color: theme.colors.text.secondary,
          letterSpacing: 0.5,
        }}>
          {t('buyerLogin.continueAsGuest') || 'Continue as Guest'}
        </Text>
      </TouchableOpacity>

      {/* Register Link */}
      <TouchableOpacity
        onPress={() => router.push('/buyer-register')}
        style={{ marginTop: theme.spacing.lg, alignItems: 'center' }}
      >
        <Text style={{
          fontSize: 12,
          fontWeight: '300',
          color: theme.colors.text.secondary,
          letterSpacing: 0.5,
        }}>
          {t('buyerLogin.register') || "Don't have an account? Register your business"}
        </Text>
      </TouchableOpacity>

      {/* Opening login via replace() (e.g. after logout) leaves no history — do not use back() */}
      <TouchableOpacity
        onPress={() => router.replace('/')}
        style={{ marginTop: theme.spacing.md, alignItems: 'center' }}
      >
        <Text style={{
          fontSize: 12,
          fontWeight: '300',
          color: theme.colors.text.secondary,
          letterSpacing: 0.5,
        }}>
          {t('buyerLogin.back') || 'Back to Marketplace'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
