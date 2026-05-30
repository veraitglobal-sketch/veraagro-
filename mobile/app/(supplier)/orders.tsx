import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { b2bSuppliersAPI } from '../../lib/api';
import { theme } from '../../lib/theme';
import { useAppLocaleTag } from '../../lib/date-locale';

const STATUSES = ['PENDING', 'CONFIRMED', 'REJECTED', 'FULFILLED', 'CANCELLED'] as const;

function orderLinesFromItems(items: unknown, t: TFunction): string[] {
  if (!Array.isArray(items)) return [];
  const def = t('supplier.defaultItem');
  return items.map((row) => {
    if (row && typeof row === 'object') {
      const o = row as { label?: string; name?: string; quantity?: number; unit?: string };
      const title = (o.label || o.name || def).trim() || def;
      const u = o.unit && o.unit !== 'order' && o.unit !== 'inquiry' ? ` ${o.unit}` : '';
      return `${title} — ${o.quantity ?? 1}${u}`.trim();
    }
    return String(row);
  });
}

function b2bOrderStatusLabel(status: string | undefined, t: TFunction): string {
  if (!status) return '—';
  const key = `supplier.b2bOrderStatus.${status}`;
  const tr = t(key);
  return tr === key ? status : tr;
}

export default function SupplierOrdersScreen() {
  const { t } = useTranslation();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const dateLocale = useAppLocaleTag();

  const fmt = useCallback(
    (iso: string | undefined) =>
      iso ? new Date(iso).toLocaleString(dateLocale) : '',
    [dateLocale],
  );

  const linesFor = useCallback((items: unknown) => orderLinesFromItems(items, t), [t]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await b2bSuppliersAPI.getIncomingOrders();
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : t('supplier.loadFailed'));
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
        Alert.alert(t('error'), e instanceof Error ? e.message : t('supplier.updateFailed'));
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
        <Text style={{ color: theme.colors.text.secondary, textAlign: 'center', marginTop: 24 }}>
          {t('supplier.noOrdersYet')}
        </Text>
      ) : (
        list.map((o) => {
          const lines = linesFor(o.items);
          return (
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
            <Text style={{ fontSize: 13, color: theme.colors.text.tertiary, marginBottom: 2 }}>
              {t('supplier.orderRef')}{' '}
              {o.id ? `${String(o.id).slice(0, 8).toUpperCase()}…` : '—'}
            </Text>
            <Text style={{ fontSize: 14, color: theme.colors.text.secondary, marginBottom: 4 }}>
              {o.farmer
                ? `${o.farmer.firstName || ''} ${o.farmer.lastName || ''} · ${o.farmer.partnerCode || ''}`
                : t('supplier.growerFallback')}
            </Text>
            <Text style={{ fontSize: 14, color: theme.colors.text.tertiary, marginBottom: 6 }}>
              {fmt(o.createdAt)}
              {o.status ? ` · ${b2bOrderStatusLabel(o.status, t)}` : ''}
            </Text>
            {lines.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                {lines.map((line, i) => (
                  <Text
                    key={i}
                    style={{ fontSize: 14, color: theme.colors.text.primary, marginBottom: 2 }}
                  >
                    • {line}
                  </Text>
                ))}
              </View>
            )}
            {o.farmerReceivedAt && (
              <Text style={{ fontSize: 14, color: '#166534', marginBottom: 6 }}>
                {t('supplier.growerReceivedAtFarm', {
                  when: fmt(o.farmerReceivedAt),
                })}
              </Text>
            )}
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
                      fontSize: 14,
                      color: o.status === s ? '#fff' : theme.colors.text.primary,
                    }}
                  >
                    {b2bOrderStatusLabel(s, t)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          );
        })
      )}
    </ScrollView>
  );
}
