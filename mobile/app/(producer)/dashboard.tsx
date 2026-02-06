import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';

/**
 * Producer Dashboard
 * Field Manager interface for farmers
 * Dark, data-focused design
 */
export default function ProducerDashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  // Mock data - will be replaced with API calls
  const activeEstates = [
    { id: 1, name: 'Njiva 1', status: 'ACTIVE', parcels: 3 },
    { id: 2, name: 'Njiva 2', status: 'INVALID', parcels: 1 },
  ];

  const conversionProgress = 245; // Days remaining
  const totalDays = 1095;

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="p-4">
        {/* Header */}
        <View className="bg-gray-800 rounded-lg p-6 mb-4">
          <Text className="text-2xl font-bold text-white mb-2">
            {t('producer.dashboard.welcome')}, {user?.firstName}
          </Text>
          <Text className="text-gray-400">
            {t('producer.dashboard.partnerCode')}: {user?.partnerCode}
          </Text>
        </View>

        {/* Conversion Progress */}
        <View className="bg-gray-800 rounded-lg p-6 mb-4 border border-green-600">
          <Text className="text-white text-lg font-semibold mb-2">
            {t('producer.dashboard.conversionProgress')}
          </Text>
          <View className="bg-gray-700 rounded-full h-4 mb-2">
            <View
              className="bg-green-600 rounded-full h-4"
              style={{ width: `${(conversionProgress / totalDays) * 100}%` }}
            />
          </View>
          <Text className="text-white text-2xl font-bold">
            {conversionProgress} / {totalDays} {t('producer.dashboard.days')}
          </Text>
          <Text className="text-gray-400 text-sm mt-1">
            {t('producer.dashboard.daysRemaining')}: {totalDays - conversionProgress}
          </Text>
        </View>

        {/* Active Estates */}
        <View className="bg-gray-800 rounded-lg p-6 mb-4">
          <Text className="text-xl font-bold text-white mb-4">
            {t('producer.dashboard.activeEstates')}
          </Text>
          {activeEstates.map((estate) => (
            <TouchableOpacity
              key={estate.id}
              className={`border rounded-lg p-4 mb-2 ${
                estate.status === 'ACTIVE'
                  ? 'border-green-600 bg-green-900/20'
                  : 'border-red-600 bg-red-900/20'
              }`}
              onPress={() => router.push(`/(producer)/estates/${estate.id}`)}
            >
              <Text className="font-semibold text-white">{estate.name}</Text>
              <Text className="text-gray-400 text-sm">
                Status: {estate.status} • {estate.parcels} {t('producer.dashboard.parcels')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View className="bg-gray-800 rounded-lg p-6">
          <Text className="text-xl font-bold text-white mb-4">
            {t('producer.dashboard.quickActions')}
          </Text>
          <TouchableOpacity
            className="bg-green-600 rounded-lg p-4 mb-3"
            onPress={() => router.push('/(producer)/scanner')}
          >
            <Text className="text-white text-center font-semibold">
              {t('producer.dashboard.scanSeed')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-blue-600 rounded-lg p-4"
            onPress={() => router.push('/(producer)/growth-journal')}
          >
            <Text className="text-white text-center font-semibold">
              {t('producer.dashboard.addEvidence')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
