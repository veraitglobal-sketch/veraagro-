import { Tabs } from 'expo-router';
import { Home, Sprout, Package, ShoppingBag, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { growerTabScreenOptions } from '../../../lib/enterprise-ui';
import { GrowerTabBar } from '../../../components/enterprise/GrowerTabBar';

/**
 * Grower tabs: Home → Field (parcels & diary) → Chain (lots & transport) → Supplies → Profile.
 * @see docs/GROWER_MOBILE_IA_REDESIGN.md
 */
export default function ProducerTabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs screenOptions={growerTabScreenOptions(insets)} tabBar={(props) => <GrowerTabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: t('producer.tabs.dashboard'),
          tabBarLabel: t('producer.tabs.home'),
          tabBarIcon: ({ color, size }) => <Home size={size || 22} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="field"
        options={{
          headerShown: false,
          title: 'Polje',
          tabBarLabel: t('producer.tabs.field'),
          tabBarIcon: ({ color, size }) => <Sprout size={size || 22} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="chain"
        options={{
          headerShown: false,
          title: t('producer.tabs.chainHub'),
          tabBarLabel: t('producer.tabs.chain'),
          tabBarIcon: ({ color, size }) => <Package size={size || 22} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="supplies"
        options={{
          headerShown: false,
          title: t('producer.tabs.suppliesHub'),
          tabBarLabel: t('producer.tabs.supplies'),
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size || 22} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          title: t('producer.tabs.profile'),
          tabBarLabel: t('producer.tabs.profile'),
          tabBarIcon: ({ color, size }) => <User size={size || 22} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen name="steps" options={{ title: t('producer.tabs.steps'), href: null }} />
      <Tabs.Screen name="products" options={{ title: t('producer.tabs.products'), href: null }} />
      <Tabs.Screen name="cost-calculator" options={{ title: t('producer.tabs.costCalculator'), href: null }} />
      <Tabs.Screen name="certifications" options={{ title: t('producer.tabs.certifications'), href: null }} />
      <Tabs.Screen name="banned-substances" options={{ title: t('producer.tabs.bannedSubstances'), href: null }} />
      <Tabs.Screen name="field-log" options={{ title: t('producer.tabs.fieldLog'), href: null }} />
      <Tabs.Screen name="harvest" options={{ title: t('producer.tabs.harvest'), href: null }} />
      <Tabs.Screen name="wallet" options={{ title: t('producer.tabs.wallet'), href: null }} />
      <Tabs.Screen name="settings" options={{ title: t('producer.tabs.settings'), href: null }} />
    </Tabs>
  );
}
