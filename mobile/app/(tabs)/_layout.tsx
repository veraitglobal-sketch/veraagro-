import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, QrCode, MapPin, BookOpen } from 'lucide-react-native';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#9ca3af',
        headerStyle: {
          backgroundColor: '#16a34a',
        },
        headerTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0.5,
          borderTopColor: '#e5e7eb',
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('tabs.dashboard'),
          tabBarLabel: t('tabs.dashboard'),
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size || 24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: t('tabs.scanner'),
          tabBarLabel: t('tabs.scanner'),
          tabBarIcon: ({ color, size }) => <QrCode size={size || 24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="estates"
        options={{
          title: t('tabs.estates'),
          tabBarLabel: t('tabs.estates'),
          tabBarIcon: ({ color, size }) => <MapPin size={size || 24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="growth-journal"
        options={{
          title: t('tabs.growthJournal'),
          tabBarLabel: t('tabs.growthJournal'),
          tabBarIcon: ({ color, size }) => <BookOpen size={size || 24} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
