import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, ShoppingBag, Package, CheckCircle2, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../lib/theme';

/**
 * Buyer tab shell — stack detail routes (cart, checkout, order) live in parent `(buyer)/_layout`.
 */
export default function BuyerTabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.text.tertiary,
          tabBarStyle: {
            backgroundColor: theme.colors.background,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            height: 60 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 8),
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 9,
            fontWeight: '300',
            letterSpacing: 0.2,
            marginTop: 0,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
          headerStyle: {
            backgroundColor: theme.colors.background,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          },
          headerTintColor: theme.colors.text.primary,
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '300',
            letterSpacing: -0.2,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: t('buyer.tabs.dashboard'),
            tabBarLabel: t('buyer.tabs.dashboard'),
            tabBarIcon: ({ color }) => <LayoutDashboard size={20} color={color} strokeWidth={1.5} />,
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: t('buyer.tabs.shop'),
            tabBarLabel: t('buyer.tabs.shop'),
            tabBarIcon: ({ color }) => <ShoppingBag size={20} color={color} strokeWidth={1.5} />,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: t('buyer.tabs.orders'),
            tabBarLabel: t('buyer.tabs.orders'),
            tabBarIcon: ({ color }) => <Package size={20} color={color} strokeWidth={1.5} />,
          }}
        />
        <Tabs.Screen
          name="vera-standard"
          options={{
            title: t('buyer.tabs.veraStandard'),
            tabBarLabel: t('buyer.tabs.standardTab'),
            tabBarIcon: ({ color }) => <CheckCircle2 size={20} color={color} strokeWidth={1.5} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('buyer.tabs.profile'),
            tabBarLabel: t('buyer.tabs.profile'),
            tabBarIcon: ({ color }) => <User size={20} color={color} strokeWidth={1.5} />,
          }}
        />
      </Tabs>
    </View>
  );
}
