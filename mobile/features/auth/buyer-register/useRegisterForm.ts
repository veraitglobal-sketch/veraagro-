import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import api from '../../../lib/api';
import { apiErrorMessage } from '../../../lib/api-error';

export function useRegisterForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [companyPosition, setCompanyPosition] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState('');

  const getCurrentLocation = useCallback(async () => {
    try {
      setGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.permissionDenied'), t('buyerRegisterScreen.permDeniedBody'));
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setLocation(coords);

      try {
        const addresses = await Location.reverseGeocodeAsync(coords);
        if (addresses.length > 0) {
          const addr = addresses[0];
          const fullAddress = [addr.street, addr.streetNumber, addr.postalCode, addr.city, addr.country]
            .filter(Boolean)
            .join(', ');
          setLocationAddress(fullAddress);
          setAddress((prev) => prev || addr.street || '');
          setCity((prev) => prev || addr.city || '');
          setPostalCode((prev) => prev || addr.postalCode || '');
          setCountry((prev) => prev || addr.country || '');
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('buyerRegisterScreen.locationFailed'));
      console.error('Location error:', error);
    } finally {
      setGettingLocation(false);
    }
  }, [t]);

  const handleRegister = useCallback(async () => {
    if (!email || !firstName || !lastName || !password) {
      Alert.alert(t('common.error'), t('buyerRegisterScreen.fillFields'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('common.error'), t('buyerRegisterScreen.passwordMin'));
      return;
    }
    if (location && (!address || !city)) {
      Alert.alert(t('common.error'), t('buyerRegisterScreen.addressWithLocation'));
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/register/buyer', {
        email,
        phone: phone || undefined,
        firstName,
        lastName,
        password,
        businessName: businessName || undefined,
        companyPosition: companyPosition || undefined,
        location: location || undefined,
        address: address || undefined,
        city: city || undefined,
        postalCode: postalCode || undefined,
        country: country || undefined,
      });

      const pending =
        response.data?.status === 'PENDING_APPROVAL' || response.data?.requiresAdminApproval;
      const partnerCode = response.data?.user?.partnerCode;
      const lines = [
        pending ? t('buyerRegisterScreen.successPending') : t('buyerRegisterScreen.successTitle'),
        partnerCode ? t('buyerRegisterScreen.successPartnerCode', { code: partnerCode }) : null,
        t('buyerRegisterScreen.successLoginHint'),
      ].filter(Boolean);
      Alert.alert(t('buyerRegisterScreen.successTitle'), lines.join('\n\n'), [
        { text: t('common.ok'), onPress: () => router.replace('/buyer-login') },
      ]);
    } catch (error: unknown) {
      console.error('Registration error:', error);
      Alert.alert(t('common.error'), apiErrorMessage(error, t('buyerRegisterScreen.registrationFailed')));
    } finally {
      setLoading(false);
    }
  }, [
    t,
    router,
    email,
    phone,
    firstName,
    lastName,
    password,
    businessName,
    companyPosition,
    location,
    address,
    city,
    postalCode,
    country,
  ]);

  return {
    loading,
    gettingLocation,
    email,
    setEmail,
    phone,
    setPhone,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    password,
    setPassword,
    businessName,
    setBusinessName,
    companyPosition,
    setCompanyPosition,
    address,
    setAddress,
    city,
    setCity,
    postalCode,
    setPostalCode,
    country,
    setCountry,
    location,
    locationAddress,
    getCurrentLocation,
    handleRegister,
  };
}

export type RegisterFormState = ReturnType<typeof useRegisterForm>;
