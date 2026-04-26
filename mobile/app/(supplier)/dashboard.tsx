import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { b2bSuppliersAPI } from '../../lib/api';
import { theme } from '../../lib/theme';

export default function SupplierDashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState(0);
  const [threads, setThreads] = useState(0);
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [o, t, p] = await Promise.all([
          b2bSuppliersAPI.getIncomingOrders(),
          b2bSuppliersAPI.getMyThreads(),
          b2bSuppliersAPI.getMyProfile().catch(() => null),
        ]);
        setOrders(Array.isArray(o) ? o.length : 0);
        setThreads(Array.isArray(t) ? t.length : 0);
        if (p && typeof p === 'object' && p !== null && 'businessName' in p) {
          setName(String((p as { businessName?: string }).businessName || ''));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!user?.roles?.includes('MATERIAL_SUPPLIER')) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ textAlign: 'center', color: theme.colors.text.secondary }}>Not a partner store user.</Text>
        <TouchableOpacity onPress={() => router.replace('/partner-login')} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.colors.primary, textAlign: 'center' }}>Sign in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 20 }}>
      {loading && <ActivityIndicator color={theme.colors.primary} style={{ marginBottom: 12 }} />}
      <Text style={{ fontSize: 22, fontWeight: '300', color: theme.colors.text.primary, marginBottom: 4 }}>
        {name || 'Partner store'}
      </Text>
      <Text style={{ fontSize: 13, color: theme.colors.text.secondary, marginBottom: 20 }}>
        {user.firstName} · {user.partnerCode}
      </Text>

      <TouchableOpacity
        onPress={() => router.push('/(supplier)/orders' as any)}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: 18,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: '500', color: theme.colors.text.primary }}>Orders from growers</Text>
        <Text style={{ fontSize: 28, fontWeight: '300', color: theme.colors.primary, marginTop: 4 }}>{orders}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/(supplier)/messages' as any)}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: 18,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: '500', color: theme.colors.text.primary }}>Messages</Text>
        <Text style={{ fontSize: 28, fontWeight: '300', color: theme.colors.primary, marginTop: 4 }}>{threads}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={async () => {
          await logout();
          router.replace('/partner-login');
        }}
        style={{ padding: 12 }}
      >
        <Text style={{ color: '#B91C1C', textAlign: 'center', fontSize: 15 }}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
