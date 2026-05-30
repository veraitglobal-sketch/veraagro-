import type { ReactNode } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../../lib/theme';
import { FormHelperText } from '../../../components/FormHelperText';
import { farmerFormUi } from '../../../lib/farmer-form-ui';
import type { RegisterFormState } from './useRegisterForm';

type Props = Pick<
  RegisterFormState,
  'email' | 'setEmail' | 'firstName' | 'setFirstName' | 'lastName' | 'setLastName' | 'password' | 'setPassword'
>;

export function RequiredFields({
  email,
  setEmail,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  password,
  setPassword,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={{ gap: 16, marginBottom: 24 }}>
      <Field label={t('buyerRegisterScreen.emailLabel')} helper={t('form.helper.registerEmail')}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={t('buyerRegisterScreen.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          style={inputStyle}
        />
      </Field>
      <Field label={t('buyerRegisterScreen.firstNameLabel')} helper={t('form.helper.registerFirstName')}>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder={t('buyerRegisterScreen.firstNamePlaceholder')}
          style={inputStyle}
        />
      </Field>
      <Field label={t('buyerRegisterScreen.lastNameLabel')} helper={t('form.helper.registerLastName')}>
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder={t('buyerRegisterScreen.lastNamePlaceholder')}
          style={inputStyle}
        />
      </Field>
      <Field label={t('buyerRegisterScreen.passwordLabel')} helper={t('form.helper.registerPassword')}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={t('buyerRegisterScreen.passwordPlaceholder')}
          secureTextEntry
          style={inputStyle}
        />
      </Field>
    </View>
  );
}

function Field({ label, helper, children }: { label: string; helper: string; children: ReactNode }) {
  return (
    <View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '500',
          color: theme.colors.text.secondary,
          marginBottom: 4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      {children}
      <FormHelperText>{helper}</FormHelperText>
    </View>
  );
}

const inputStyle = {
  backgroundColor: theme.colors.surface,
  borderRadius: theme.borderRadius.md,
  ...farmerFormUi.input,
  borderWidth: 0.5,
  borderColor: 'rgba(0, 0, 0, 0.1)',
  fontWeight: '400' as const,
  color: theme.colors.text.primary,
};
