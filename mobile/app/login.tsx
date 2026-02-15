import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Leaf } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../lib/theme';

/**
 * Universal Login Screen
 * Single login for all user types - role is automatically detected
 */
export default function LoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(t('error'), t('login.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const response = await login(username, password);
      const userRoles = response.user.roles || (response.user.role ? [response.user.role] : []);
      if (userRoles.some((role: string) => ['ADMIN', 'FARMER', 'PARTNER', 'GROWER'].includes(role))) {
        router.replace('/(producer)/(tabs)');
      } else if (userRoles.some((role: string) => ['BUYER', 'CUSTOMER'].includes(role))) {
        router.replace('/(buyer)/shop');
      } else {
        router.replace('/(buyer)/shop');
      }
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('login.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <Leaf size={28} color="#fff" strokeWidth={1.5} />
        </View>
        <Text style={styles.brand}>Bio Vera</Text>
        <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('login.username')}</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder={t('login.usernamePlaceholder')}
          placeholderTextColor={theme.colors.text.tertiary}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <Text style={styles.label}>{t('login.password')}</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={t('login.passwordPlaceholder')}
          placeholderTextColor={theme.colors.text.tertiary}
          secureTextEntry
          style={[styles.input, styles.inputLast]}
        />
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={[styles.button, loading && styles.buttonDisabled]}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('login.button')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push('/buyer-register')} activeOpacity={0.7}>
          <Text style={styles.link}>{t('login.registerBuyer')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.link}>{t('login.backToMarketplace')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  brand: {
    fontSize: 26,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    fontSize: 16,
    color: theme.colors.text.primary,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  inputLast: {
    marginBottom: theme.spacing.lg,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  link: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
