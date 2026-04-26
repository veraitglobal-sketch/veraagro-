import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { b2bSuppliersAPI } from '../../lib/api';
import { theme } from '../../lib/theme';

const STATUSES = ['PENDING', 'CONFIRMED', 'REJECTED', 'FULFILLED', 'CANCELLED'] as const;

export default function SupplierOrdersScreen() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await b2bSuppliersAPI.getIncomingOrders();
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const setStatus = (orderId: string, status: (typeof STATUSES)[number]) => {
    void (async () => {
      try {
        await b2bSuppliersAPI.patchOrderStatus(orderId, { status });
        await load();
      } catch (e) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Update failed');
      }
    })();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16 }}>
      {list.length === 0 ? (
        <Text style={{ color: theme.colors.text.secondary, textAlign: 'center', marginTop: 24 }}>No orders yet</Text>
      ) : (
        list.map((o) => (
          <View
            key={o.id}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: 14,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginBottom: 4 }}>
              {o.farmer ? `${o.farmer.firstName || ''} ${o.farmer.lastName || ''} · ${o.farmer.partnerCode || ''}` : 'Grower'}
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.text.tertiary, marginBottom: 8 }}>
              {o.createdAt ? new Date(o.createdAt).toLocaleString() : ''} · {o.status}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {STATUSES.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatus(o.id, s)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    backgroundColor: o.status === s ? theme.colors.primary : theme.colors.background,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: o.status === s ? '#fff' : theme.colors.text.primary,
                    }}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
