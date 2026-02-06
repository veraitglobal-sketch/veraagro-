import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

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
      await login(partnerCode, password);
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('login.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center px-6">
      <Text className="text-3xl font-bold text-green-600 mb-2 text-center">
        VERA Ecosystem
      </Text>
      <Text className="text-gray-600 mb-8 text-center">
        {t('login.subtitle')}
      </Text>

      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder={t('login.partnerCode')}
        value={partnerCode}
        onChangeText={setPartnerCode}
        autoCapitalize="none"
      />

      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6"
        placeholder={t('login.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        className="bg-green-600 rounded-lg py-4"
        onPress={handleLogin}
        disabled={loading}
      >
        <Text className="text-white text-center font-semibold text-lg">
          {loading ? t('login.loading') : t('login.button')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
