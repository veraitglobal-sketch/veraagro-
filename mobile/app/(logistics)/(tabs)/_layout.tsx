import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, ClipboardList, User } from 'lucide-react-native';
import { growerTabScreenOptions } from '../../../lib/enterprise-ui';
import { LogisticsTabBar } from '../../../components/logistics/LogisticsTabBar';

export default function LogisticsTabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs screenOptions={growerTabScreenOptions(insets)} tabBar={(props) => <LogisticsTabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: t('logistics.tabs.home'),
          tabBarIcon: ({ color, size }) => <Home size={size || 22} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          headerShown: false,
          title: t('logistics.tabs.missions'),
          tabBarIcon: ({ color, size }) => <ClipboardList size={size || 22} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          title: t('logistics.tabs.profile'),
          tabBarIcon: ({ color, size }) => <User size={size || 22} color={color} strokeWidth={1.5} />,
        }}
      />
    </Tabs>
  );
}
