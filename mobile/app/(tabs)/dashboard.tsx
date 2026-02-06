import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  // Mock data - will be replaced with API calls
  const conversionProgress = 245; // Days remaining
  const totalDays = 1095;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Welcome Card */}
        <View className="bg-white rounded-lg p-6 mb-4 shadow-sm">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            {t('dashboard.welcome')}, {user?.firstName}!
          </Text>
          <Text className="text-gray-600">
            {t('dashboard.partnerCode')}: {user?.partnerCode}
          </Text>
        </View>

        {/* Conversion Progress Card */}
        <View className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 mb-4">
          <Text className="text-white text-lg font-semibold mb-2">
            {t('dashboard.conversionProgress')}
          </Text>
          <View className="bg-white/20 rounded-full h-4 mb-2">
            <View
              className="bg-white rounded-full h-4"
              style={{ width: `${(conversionProgress / totalDays) * 100}%` }}
            />
          </View>
          <Text className="text-white text-2xl font-bold">
            {conversionProgress} / {totalDays} {t('dashboard.days')}
          </Text>
          <Text className="text-white/80 text-sm mt-1">
            {t('dashboard.daysRemaining')}: {totalDays - conversionProgress}
          </Text>
        </View>

        {/* Active Estates */}
        <View className="bg-white rounded-lg p-6 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            {t('dashboard.activeEstates')}
          </Text>
          <TouchableOpacity
            className="border border-gray-200 rounded-lg p-4 mb-2"
            onPress={() => router.push('/(tabs)/estates')}
          >
            <Text className="font-semibold text-gray-800">Estate 1</Text>
            <Text className="text-gray-600 text-sm">Status: Active</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-lg p-6 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            {t('dashboard.quickActions')}
          </Text>
          <TouchableOpacity
            className="bg-green-600 rounded-lg p-4 mb-3"
            onPress={() => router.push('/(tabs)/scanner')}
          >
            <Text className="text-white text-center font-semibold">
              {t('dashboard.scanSeed')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-blue-600 rounded-lg p-4"
            onPress={() => router.push('/(tabs)/growth-journal')}
          >
            <Text className="text-white text-center font-semibold">
              {t('dashboard.addEvidence')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
