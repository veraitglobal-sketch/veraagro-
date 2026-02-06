import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../lib/theme';

/**
 * Universal Login Screen
 * Single login for all user types - role is automatically detected
 */
export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login, logout } = useAuth();
  const [username, setUsername] = useState(''); // Can be email or partnerCode
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(t('error') || 'Error', t('login.fillAllFields') || 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      // Login with username (email or partnerCode) and password
      const response = await login(username, password);
      
      // Get user roles
      const userRoles = response.user.roles || (response.user.role ? [response.user.role] : []);
      
      // Automatically navigate based on role
      if (userRoles.some(role => ['ADMIN', 'FARMER', 'PARTNER', 'GROWER'].includes(role))) {
        // Producer/Admin - navigate to producer dashboard
        router.replace('/(producer)/(tabs)');
      } else if (userRoles.some(role => ['BUYER', 'CUSTOMER'].includes(role))) {
        // Buyer - navigate to buyer dashboard
        router.replace('/(buyer)/shop');
      } else {
        // Default to buyer shop if no specific role
        router.replace('/(buyer)/shop');
      }
    } catch (error: any) {
      Alert.alert(
        t('error') || 'Error',
        error.message || t('login.failed') || 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.primary, justifyContent: 'center', padding: theme.spacing.xl }}>
      {/* Header */}
      <View style={{ marginBottom: theme.spacing.xl, alignItems: 'center' }}>
        <View style={{
          width: 64,
          height: 64,
          borderRadius: theme.borderRadius.lg,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing.md,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        }}>
          <Text style={{ fontSize: 36 }}>🌱</Text>
        </View>
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
          color: 'rgba(255, 255, 255, 0.85)',
          letterSpacing: 0.5,
          textAlign: 'center',
        }}>
          {t('login.subtitle') || 'Sign in to access your account'}
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
          fontWeight: '400',
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          {t('login.username') || 'Username / Email / Partner Code'}
        </Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder={t('login.usernamePlaceholder') || 'Enter username, email or partner code'}
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
          fontWeight: '400',
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          {t('login.password') || 'Password'}
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={t('login.passwordPlaceholder') || 'Enter password'}
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
            marginTop: theme.spacing.md,
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
              {t('login.button') || 'Sign In'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Register Links */}
      <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
        <TouchableOpacity
          onPress={() => router.push('/buyer-register')}
        >
          <Text style={{
            fontSize: 12,
            fontWeight: '300',
            color: 'rgba(255, 255, 255, 0.8)',
            letterSpacing: 0.5,
          }}>
            {t('login.registerBuyer') || 'Register as Buyer'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Text style={{
            fontSize: 12,
            fontWeight: '300',
            color: 'rgba(255, 255, 255, 0.8)',
            letterSpacing: 0.5,
          }}>
            {t('login.backToMarketplace') || 'Back to Marketplace'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
