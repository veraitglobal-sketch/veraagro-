import { Tabs } from 'expo-router';
import { Home, FileText, Package, User, MapPin, Calculator, Award, ShieldAlert } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Producer Mobile Panel - Tab Navigation
 * Matches buyer dashboard styling
 */
export default function ProducerTabsLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(0, 0, 0, 0.08)',
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
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(0, 0, 0, 0.08)',
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '300',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size || 24} color={color} strokeWidth={1} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Moji proizvodi',
          tabBarLabel: 'Proizvodi',
          tabBarIcon: ({ color, size }) => <Package size={size || 24} color={color} strokeWidth={1} />,
        }}
      />
      <Tabs.Screen
        name="cost-calculator"
        options={{
          title: 'Kalkulator troškova',
          tabBarLabel: 'Troškovi',
          tabBarIcon: ({ color, size }) => <Calculator size={size || 24} color={color} strokeWidth={1} />,
        }}
      />
      <Tabs.Screen
        name="certifications"
        options={{
          title: 'Sertifikacije',
          tabBarLabel: 'Sertifikati',
          tabBarIcon: ({ color, size }) => <Award size={size || 24} color={color} strokeWidth={1} />,
        }}
      />
      <Tabs.Screen
        name="banned-substances"
        options={{
          title: 'Zabranjena sredstva',
          tabBarLabel: 'Zabranjeno',
          tabBarIcon: ({ color, size }) => <ShieldAlert size={size || 24} color={color} strokeWidth={1} />,
        }}
      />
      <Tabs.Screen
        name="estates"
        options={{
          title: 'Estates',
          tabBarLabel: 'Estates',
          tabBarIcon: ({ color, size }) => <MapPin size={size || 24} color={color} strokeWidth={1} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="field-log"
        options={{
          title: 'Work Entry',
          tabBarLabel: 'Journal',
          tabBarIcon: ({ color, size }) => <FileText size={size || 24} color={color} strokeWidth={1} />,
        }}
      />
      <Tabs.Screen
        name="batches"
        options={{
          title: 'Batches',
          tabBarLabel: 'Batches',
          tabBarIcon: ({ color, size }) => <Package size={size || 24} color={color} strokeWidth={1} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Settings',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size || 24} color={color} strokeWidth={1} />,
        }}
      />
      <Tabs.Screen
        name="harvest"
        options={{
          title: 'Report Harvest',
          href: null, // Hide from tabs, accessible via navigation
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          href: null, // Hide from tabs, accessible via navigation
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          href: null, // Hide from tabs, accessible via navigation
        }}
      />
    </Tabs>
  );
}
