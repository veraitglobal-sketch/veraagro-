import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/lib/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuth();
  const [partnerCode, setPartnerCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!partnerCode || !password) {
      Alert.alert(t('error'), t('login.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const response = await login(partnerCode, password);
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
    <View style={styles.container}>
      <Text style={styles.title}>VERA Ecosystem</Text>
      <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('login.partnerCode')}
        placeholderTextColor={theme.colors.text.tertiary}
        value={partnerCode}
        onChangeText={setPartnerCode}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder={t('login.password')}
        placeholderTextColor={theme.colors.text.tertiary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>
          {loading ? t('login.loading') : t('login.button')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    letterSpacing: -0.2,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    marginBottom: theme.spacing.md,
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: theme.colors.text.inverse,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
});
