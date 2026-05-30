import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { FormKeyboardWrap } from '../../../components/FormKeyboardWrap';
import { a11yIconButton } from '../../../lib/date-locale';
import { useRegisterForm } from './useRegisterForm';
import { RequiredFields } from './RequiredFields';
import { OptionalFields } from './OptionalFields';

export default function BuyerRegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const form = useRegisterForm();

  return (
    <FormKeyboardWrap style={{ backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View
          style={{
            paddingTop: p.headerTop,
            paddingBottom: theme.spacing.md,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            backgroundColor: theme.colors.background,
            borderBottomWidth: 0.5,
            borderBottomColor: 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginRight: theme.spacing.md }}
              {...a11yIconButton(t('common.back'))}
            >
              <ArrowLeft size={20} color={theme.colors.text.primary} strokeWidth={1.5} />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '400',
                color: theme.colors.text.primary,
                letterSpacing: 1,
              }}
            >
              {t('buyerRegisterScreen.title')}
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: theme.spacing.lg,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.lg),
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.lg,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '400',
                color: theme.colors.text.secondary,
                lineHeight: 18,
                letterSpacing: 0.2,
              }}
            >
              {t('buyerRegisterScreen.intro')}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 14,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.sm,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {t('buyerRegisterScreen.requiredSection')}
          </Text>
          <RequiredFields
            email={form.email}
            setEmail={form.setEmail}
            firstName={form.firstName}
            setFirstName={form.setFirstName}
            lastName={form.lastName}
            setLastName={form.setLastName}
            password={form.password}
            setPassword={form.setPassword}
          />

          <Text
            style={{
              fontSize: 14,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.sm,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {t('buyerRegisterScreen.optionalSection')}
          </Text>
          <OptionalFields
            phone={form.phone}
            setPhone={form.setPhone}
            businessName={form.businessName}
            setBusinessName={form.setBusinessName}
            companyPosition={form.companyPosition}
            setCompanyPosition={form.setCompanyPosition}
            gettingLocation={form.gettingLocation}
            location={form.location}
            locationAddress={form.locationAddress}
            getCurrentLocation={form.getCurrentLocation}
            address={form.address}
            setAddress={form.setAddress}
            city={form.city}
            setCity={form.setCity}
          />

          <TouchableOpacity
            onPress={() => void form.handleRegister()}
            disabled={form.loading}
            accessibilityRole="button"
            accessibilityLabel={t('buyerRegisterScreen.submit')}
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: theme.borderRadius.md,
              minHeight: 48,
              padding: 12,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: theme.spacing.lg,
              opacity: form.loading ? 0.7 : 1,
            }}
          >
            {form.loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ fontSize: 14, fontWeight: '400', color: '#fff', letterSpacing: 1 }}>
                {t('buyerRegisterScreen.submit')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/buyer-login')}
            accessibilityRole="button"
            accessibilityLabel={t('buyerRegisterScreen.hasAccount')}
            style={{ marginTop: theme.spacing.md, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 14, fontWeight: '400', color: theme.colors.text.secondary }}>
              {t('buyerRegisterScreen.hasAccount')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </FormKeyboardWrap>
  );
}
