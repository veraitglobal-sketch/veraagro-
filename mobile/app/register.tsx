import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { AuthScreenShell } from '../components/auth/AuthScreenShell';
import { AuthBrandHero } from '../components/auth/AuthBrandHero';
import { AuthFormHeader } from '../components/auth/AuthFormHeader';
import AuthTextField from '../components/auth/AuthTextField';
import { EnterpriseButton, EnterprisePanel } from '../design-system';
import { enterpriseColors, enterpriseUi } from '../lib/enterprise-ui';
import { markStepComplete } from '../lib/grower-journey';
import { authAPI } from '../lib/api';
import { apiErrorMessage } from '../lib/api-error';
import { partnerSignInHref } from '../lib/post-login-redirect';

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
      Alert.alert(t('register.successTitle'), t('register.checkEmailMessage'), [
        { text: t('common.ok'), onPress: () => router.replace(partnerSignInHref() as Href) },
      ]);
    } catch (e: unknown) {
      Alert.alert(t('error'), apiErrorMessage(e, t('register.failed')));
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <View style={styles.footer}>
      <Text style={styles.footerLead}>{t('register.hasAccount')}</Text>
      <TouchableOpacity
        onPress={() => router.replace(partnerSignInHref() as Href)}
        activeOpacity={0.7}
        style={styles.footerBtn}
      >
        <Text style={styles.footerAccent}>{t('register.signIn')}</Text>
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
                onPress={() => router.back()}
                style={styles.backRow}
                hitSlop={12}
                accessibilityLabel={t('common.back')}
                activeOpacity={0.7}
              >
                <ChevronLeft size={20} color={enterpriseColors.gray600} strokeWidth={1.75} />
                <Text style={styles.backText}>{t('common.back')}</Text>
              </TouchableOpacity>

              <AuthBrandHero compact />

              <EnterprisePanel variant="premium" padding="lg">
                <AuthFormHeader
                  eyebrow={t('register.eyebrow')}
                  title={t('register.title')}
                  subtitle={t('register.subtitle')}
                />

                <View style={styles.nameRow}>
                  <AuthTextField
                    label={t('register.firstName')}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder={t('register.firstNamePlaceholder')}
                    autoCapitalize="words"
                    containerStyle={styles.nameCol}
                  />
                  <AuthTextField
                    label={t('register.lastName')}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder={t('register.lastNamePlaceholder')}
                    autoCapitalize="words"
                    containerStyle={styles.nameCol}
                  />
                </View>

                <AuthTextField
                  label={t('register.email')}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('register.emailPlaceholder')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <AuthTextField
                  label={t('register.hectares')}
                  hint={t('register.hectaresHint')}
                  value={hectares}
                  onChangeText={setHectares}
                  placeholder={t('register.hectaresPlaceholder')}
                  keyboardType="decimal-pad"
                />

                <AuthTextField
                  label={t('register.password')}
                  hint={t('register.passwordHint')}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('register.passwordPlaceholder')}
                  secureTextEntry
                  containerStyle={styles.lastField}
                />

                <EnterpriseButton
                  label={t('register.submit')}
                  onPress={handleRegister}
                  loading={loading}
                  disabled={loading}
                  size="large"
                  fullWidth
                  style={styles.submit}
                />
              </EnterprisePanel>
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
    paddingVertical: 12,
    paddingBottom: 24,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 2,
  },
  backText: {
    fontSize: 15,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    letterSpacing: -0.1,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 2,
  },
  nameCol: {
    flex: 1,
    marginBottom: 0,
  },
  lastField: {
    marginBottom: 0,
  },
  submit: {
    marginTop: 20,
  },
  footer: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  footerLead: {
    fontSize: 14,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    textAlign: 'center',
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
});
