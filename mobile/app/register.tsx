import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '../lib/theme';
import { markStepComplete } from '../lib/grower-journey';
import { authAPI } from '../lib/api';

/**
 * Grower registration – Faza 1 of Grower Journey
 * Registers via API, sends verification email. User must verify to activate account.
 */
export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [hectares, setHectares] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert(t('error'), t('register.fillAllFields'));
      return;
    }
    const ha = parseFloat(String(hectares).replace(',', '.'));
    if (isNaN(ha) || ha <= 0) {
      Alert.alert(t('error'), t('register.enterHectares'));
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert(t('error'), t('register.passwordMin'));
      return;
    }

    setLoading(true);
    try {
      await authAPI.registerGrower({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: undefined,
        totalHectares: ha,
      });
      await markStepComplete(1);
      Alert.alert(
        t('register.successTitle'),
        t('register.checkEmailMessage'),
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || t('register.failed');
      Alert.alert(t('error'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View
        style={{
          paddingTop: 56,
          paddingBottom: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: theme.colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.colors.border,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: theme.spacing.md }}>
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '600', color: theme.colors.text.primary }}>
          {t('register.title')}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 13, color: theme.colors.text.secondary, marginBottom: theme.spacing.lg }}>
          {t('register.subtitle')}
        </Text>

        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={labelStyle}>{t('register.firstName')}</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t('register.firstNamePlaceholder')}
            placeholderTextColor={theme.colors.text.tertiary}
            style={inputStyle}
            autoCapitalize="words"
          />
        </View>
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={labelStyle}>{t('register.lastName')}</Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder={t('register.lastNamePlaceholder')}
            placeholderTextColor={theme.colors.text.tertiary}
            style={inputStyle}
            autoCapitalize="words"
          />
        </View>
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={labelStyle}>{t('register.email')}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('register.emailPlaceholder')}
            placeholderTextColor={theme.colors.text.tertiary}
            style={inputStyle}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={labelStyle}>{t('register.hectares')}</Text>
          <TextInput
            value={hectares}
            onChangeText={setHectares}
            placeholder={t('register.hectaresPlaceholder')}
            placeholderTextColor={theme.colors.text.tertiary}
            style={inputStyle}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={{ marginBottom: theme.spacing.xl }}>
          <Text style={labelStyle}>{t('register.password')}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t('register.passwordPlaceholder')}
            placeholderTextColor={theme.colors.text.tertiary}
            style={inputStyle}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          style={{
            backgroundColor: theme.colors.primary,
            paddingVertical: 14,
            borderRadius: theme.borderRadius.lg,
            alignItems: 'center',
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>{t('register.submit')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const labelStyle: TextStyle = {
  fontSize: 12,
  fontWeight: '500',
  color: theme.colors.text.secondary,
  marginBottom: 6,
};
const inputStyle: TextStyle = {
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: theme.borderRadius.md,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 16,
  color: theme.colors.text.primary,
};
