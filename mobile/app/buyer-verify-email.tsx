import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authAPI } from '../lib/api';
import { apiErrorMessage } from '../lib/api-error';
import { enterpriseColors, enterpriseUi } from '../lib/enterprise-ui';

export default function BuyerVerifyEmailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!/^\d{4}$/.test(code.trim())) {
      Alert.alert(t('error'), t('buyerVerifyEmail.codeRequired'));
      return;
    }
    setLoading(true);
    try {
      await authAPI.verifyEmailCode(email.trim(), code.trim());
      Alert.alert(t('buyerVerifyEmail.successTitle'), t('buyerVerifyEmail.successBody'), [
        { text: t('common.ok'), onPress: () => router.replace('/buyer-login') },
      ]);
    } catch (e: unknown) {
      Alert.alert(t('error'), apiErrorMessage(e, t('buyerVerifyEmail.failed')));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    try {
      await authAPI.resendVerificationCode(email.trim());
      Alert.alert(t('buyerVerifyEmail.resendTitle'), t('buyerVerifyEmail.resendBody'));
    } catch {
      Alert.alert(t('buyerVerifyEmail.resendTitle'), t('buyerVerifyEmail.resendBody'));
    }
  };

  return (
    <SafeAreaView style={enterpriseUi.authCanvas}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('buyerVerifyEmail.title')}</Text>
        <Text style={styles.subtitle}>{t('buyerVerifyEmail.subtitle')}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder={t('buyerRegisterScreen.email')}
        />
        <TextInput
          style={[styles.input, styles.codeInput]}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 4))}
          keyboardType="number-pad"
          maxLength={4}
          placeholder="0000"
        />
        <TouchableOpacity style={styles.primaryBtn} onPress={handleVerify} disabled={loading}>
          <Text style={styles.primaryBtnText}>{loading ? t('buyerVerifyEmail.verifying') : t('buyerVerifyEmail.submit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleResend}>
          <Text style={styles.link}>{t('buyerVerifyEmail.resend')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { margin: 20, padding: 24, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  title: { fontSize: 22, color: '#111827', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  codeInput: { textAlign: 'center', letterSpacing: 8, fontSize: 24, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: enterpriseColors.primary,
    borderRadius: 8,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: enterpriseColors.primary, textAlign: 'center', marginTop: 16 },
});
