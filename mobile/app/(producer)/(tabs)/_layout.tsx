import { Tabs } from 'expo-router';
import { Home, Package, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../../lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Producer (farmer) – 3 glavna taba: Home, Products, Profile.
 * Ostalo dostupno preko dashboarda (quick actions).
 */
export default function ProducerTabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          height: 56 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          letterSpacing: -0.2,
          marginTop: 2,
        },
        tabBarIconStyle: { marginTop: 0 },
        headerStyle: {
          backgroundColor: theme.colors.background,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('producer.tabs.dashboard'),
          tabBarLabel: t('producer.tabs.home'),
          tabBarIcon: ({ color, size }) => <Home size={size || 22} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: t('producer.tabs.products'),
          tabBarLabel: t('producer.tabs.products'),
          tabBarIcon: ({ color, size }) => <Package size={size || 22} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('producer.tabs.profile'),
          tabBarLabel: t('producer.tabs.profile'),
          tabBarIcon: ({ color, size }) => <User size={size || 22} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen name="cost-calculator" options={{ title: t('producer.tabs.costCalculator'), href: null }} />
      <Tabs.Screen name="certifications" options={{ title: t('producer.tabs.certifications'), href: null }} />
      <Tabs.Screen name="banned-substances" options={{ title: t('producer.tabs.bannedSubstances'), href: null }} />
      <Tabs.Screen name="field-log" options={{ title: t('producer.tabs.fieldLog'), href: null }} />
      <Tabs.Screen name="shop" options={{ href: null }} />
      <Tabs.Screen name="harvest" options={{ title: t('producer.tabs.harvest'), href: null }} />
      <Tabs.Screen name="wallet" options={{ title: t('producer.tabs.wallet'), href: null }} />
      <Tabs.Screen name="settings" options={{ title: t('producer.tabs.settings'), href: null }} />
    </Tabs>
  );
}
