import type { ReactNode } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { FormHelperText } from '../../../components/FormHelperText';
import { farmerFormUi } from '../../../lib/farmer-form-ui';
import type { RegisterFormState } from './useRegisterForm';

type Props = Pick<
  RegisterFormState,
  | 'phone'
  | 'setPhone'
  | 'businessName'
  | 'setBusinessName'
  | 'companyPosition'
  | 'setCompanyPosition'
  | 'gettingLocation'
  | 'location'
  | 'locationAddress'
  | 'getCurrentLocation'
  | 'address'
  | 'setAddress'
  | 'city'
  | 'setCity'
>;

export function OptionalFields({
  phone,
  setPhone,
  businessName,
  setBusinessName,
  companyPosition,
  setCompanyPosition,
  gettingLocation,
  location,
  locationAddress,
  getCurrentLocation,
  address,
  setAddress,
  city,
  setCity,
}: Props) {
  const { t } = useTranslation();
  const locationBtnLabel = location
    ? t('buyerRegisterScreen.locationSet')
    : t('buyerRegisterScreen.getLocation');

  return (
    <>
      <View style={{ gap: 16, marginBottom: 24 }}>
        <Field label={t('buyerRegisterScreen.phoneLabel')} helper={t('form.helper.registerPhone')}>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder={t('buyerRegisterScreen.phonePlaceholder')}
            keyboardType="phone-pad"
            style={inputStyle}
          />
        </Field>
        <Field label={t('buyerRegisterScreen.businessNameLabel')} helper={t('form.helper.registerBusinessName')}>
          <TextInput
            value={businessName}
            onChangeText={setBusinessName}
            placeholder={t('buyerRegisterScreen.businessNamePlaceholder')}
            style={inputStyle}
          />
        </Field>
        <Field label={t('buyerRegisterScreen.positionLabel')} helper={t('form.helper.registerPosition')}>
          <TextInput
            value={companyPosition}
            onChangeText={setCompanyPosition}
            placeholder={t('buyerRegisterScreen.positionPlaceholder')}
            style={inputStyle}
          />
        </Field>
      </View>

      <Text
        style={{
          fontSize: 14,
          fontWeight: '500',
          color: theme.colors.text.secondary,
          marginBottom: 16,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {t('buyerRegisterScreen.locationSection')}
      </Text>

      <View style={{ gap: 16, marginBottom: 24 }}>
        <TouchableOpacity
          onPress={() => void getCurrentLocation()}
          disabled={gettingLocation}
          accessibilityRole="button"
          accessibilityLabel={locationBtnLabel}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            ...farmerFormUi.touchTarget,
            borderWidth: 0.5,
            borderColor: location ? theme.colors.primary : 'rgba(0, 0, 0, 0.1)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {gettingLocation ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <>
              <MapPin
                size={20}
                color={location ? theme.colors.primary : theme.colors.text.secondary}
                strokeWidth={1.5}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: location ? theme.colors.primary : theme.colors.text.secondary,
                  marginLeft: theme.spacing.sm,
                }}
              >
                {locationBtnLabel}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {location ? (
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: 16,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '400', color: theme.colors.text.secondary, marginBottom: 4 }}>
              {t('buyerRegisterScreen.detectedAddress')}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '400', color: theme.colors.text.primary }}>
              {locationAddress || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
            </Text>
          </View>
        ) : null}

        <Field
          label={location ? t('buyerRegisterScreen.addressRequiredLabel') : t('buyerRegisterScreen.addressLabel')}
          helper={t('form.helper.registerAddress')}
        >
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder={t('buyerRegisterScreen.addressPlaceholder')}
            style={inputStyle}
          />
        </Field>
        <Field
          label={location ? t('buyerRegisterScreen.cityRequiredLabel') : t('buyerRegisterScreen.cityLabel')}
          helper={t('form.helper.registerCity')}
        >
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder={t('buyerRegisterScreen.cityPlaceholder')}
            style={inputStyle}
          />
        </Field>
      </View>
    </>
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
