import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { b2bSuppliersAPI } from '../../lib/api';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { theme } from '../../lib/theme';
import { Package, MessageCircle, MapPin, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppLocaleTag } from '../../lib/date-locale';

function formatOrderLines(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items.map((row) => {
    if (row && typeof row === 'object' && 'label' in row) {
      const o = row as { label: string; quantity?: number; unit?: string };
      const u = o.unit && o.unit !== 'order' && o.unit !== 'inquiry' ? ` ${o.unit}` : '';
      return `${o.label} — ${o.quantity ?? 1}${u}`.trim();
    }
    return String(row);
  });
}

type Order = {
  id: string;
  supplierUserId: string;
  status: string;
  items: unknown;
  noteFromFarmer: string | null;
  farmerReceivedAt?: string | null;
  createdAt: string;
  supplier: { firstName: string | null; lastName: string | null; partnerCode: string | null } | null;
};

type Thread = {
  id: string;
  supplierUserId: string;
  lastMessageAt: string;
  supplier: {
    firstName: string | null;
    lastName: string | null;
    partnerCode: string | null;
    material_supplier_profile: { businessName: string; city: string | null; country: string | null } | null;
  };
};

export default function GrowerPartnerOrdersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const [orders, setOrders] = useState<Order[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [receivingId, setReceivingId] = useState<string | null>(null);

  const dateLocale = useAppLocaleTag();

  const orderPartnerFallback = () => t('producer.dashboard.partnerOrders.partnerFallback');

  const orderPartnerLabel = (o: Order) => {
    if (!o.supplier) return orderPartnerFallback();
    const n = [o.supplier.firstName, o.supplier.lastName].filter(Boolean).join(' ').trim();
    if (n) return n;
    return o.supplier.partnerCode || orderPartnerFallback();
  };

  const resolveThreadTitle = (row: Thread) => {
    const fb = t('producer.dashboard.partnerOrders.partnerFallback');
    const b = row.supplier?.material_supplier_profile?.businessName;
    if (b) return b;
    const n = [row.supplier?.firstName, row.supplier?.lastName].filter(Boolean).join(' ').trim();
    return n || row.supplier?.partnerCode || fb;
  };

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [o, th] = await Promise.all([
        b2bSuppliersAPI.getMyDirectOrders(),
        b2bSuppliersAPI.getMyThreadsAsFarmer(),
      ]);
      setOrders(o as Order[]);
      setThreads(th as Thread[]);
    } catch (e) {
      setErr(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (e instanceof Error ? e.message : t('producer.dashboard.partnerOrders.loadFailed')),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const markReceived = async (orderId: string) => {
    setReceivingId(orderId);
    setErr(null);
    try {
      await b2bSuppliersAPI.markOrderReceivedAtFarm(orderId);
      await load();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErr(
        typeof msg === 'string' ? msg : e instanceof Error ? e.message : t('producer.dashboard.partnerOrders.markReceivedFailed'),
      );
    } finally {
      setReceivingId(null);
    }
  };

  return (
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{
          padding: p.screenPaddingLeft,
          paddingBottom: p.bottomInset + theme.spacing.lg,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {loading && !orders.length && !threads.length ? (
          <View style={{ padding: theme.spacing.lg, alignItems: 'center' }}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : null}

        {err ? (
          <View
            style={{
              backgroundColor: theme.colors.warningLight,
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <Text style={{ color: theme.colors.text.primary, fontSize: 14 }}>{err}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={() => router.push('/map' as any)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.primaryLight,
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.lg,
            marginBottom: theme.spacing.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <MapPin size={20} color={theme.colors.primary} strokeWidth={1.75} />
          <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.primary }}>
              {t('producer.dashboard.suppliersMap')}
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 }}>
              {t('producer.dashboard.suppliersMapDesc')}
            </Text>
          </View>
          <ChevronRight size={18} color={theme.colors.text.tertiary} />
        </TouchableOpacity>

        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text.primary, marginBottom: theme.spacing.sm }}>
          {t('producer.dashboard.partnerOrders.directOrders')}
        </Text>
        {orders.length === 0 && !loading ? (
          <Text style={{ fontSize: 14, color: theme.colors.text.secondary, marginBottom: theme.spacing.lg, lineHeight: 20 }}>
            {t('producer.dashboard.partnerOrders.emptyOrders')}
          </Text>
        ) : (
          orders.map((o) => (
            <View
              key={o.id}
              style={{
                backgroundColor: theme.colors.surfaceElevated,
                borderRadius: theme.borderRadius.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.md,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text.primary, flex: 1 }}>
                  {orderPartnerLabel(o)}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: theme.colors.text.secondary,
                    textTransform: 'capitalize' as const,
                  }}
                >
                  {t(`supplier.b2bOrderStatus.${o.status}`, { defaultValue: o.status })}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: theme.colors.text.tertiary, marginBottom: 6 }}>
                {new Date(o.createdAt).toLocaleString(dateLocale)}
              </Text>
              {formatOrderLines(o.items).map((line, i) => (
                <Text key={i} style={{ fontSize: 13, color: theme.colors.text.primary, lineHeight: 20 }}>
                  • {line}
                </Text>
              ))}
              {o.farmerReceivedAt ? (
                <Text style={{ fontSize: 12, color: '#166534', marginTop: theme.spacing.sm, fontWeight: '600' }}>
                  {t('producer.dashboard.partnerOrders.receivedAtFarmWithWhen', {
                    when: new Date(o.farmerReceivedAt).toLocaleString(dateLocale),
                  })}
                </Text>
              ) : null}
              {!o.farmerReceivedAt && (o.status === 'CONFIRMED' || o.status === 'FULFILLED') ? (
                <TouchableOpacity
                  onPress={() => void markReceived(o.id)}
                  disabled={receivingId === o.id}
                  style={{
                    marginTop: theme.spacing.sm,
                    alignSelf: 'flex-start',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: theme.borderRadius.md,
                    borderWidth: 1,
                    borderColor: theme.colors.primary,
                    opacity: receivingId === o.id ? 0.6 : 1,
                  }}
                >
                  <Text style={{ fontSize: 13, color: theme.colors.primary, fontWeight: '600' }}>
                    {receivingId === o.id
                      ? t('producer.dashboard.partnerOrders.receivingInProgress')
                      : t('producer.dashboard.partnerOrders.markReceivedAtFarm')}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {!o.farmerReceivedAt && o.status === 'PENDING' ? (
                <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginTop: theme.spacing.sm }}>
                  {t('producer.dashboard.partnerOrders.waitingSupplierConfirm')}
                </Text>
              ) : null}
              <TouchableOpacity
                onPress={() => router.push(`/b2b-supplier/${o.supplierUserId}` as any)}
                style={{ marginTop: theme.spacing.sm, flexDirection: 'row', alignItems: 'center' }}
              >
                <MessageCircle size={16} color={theme.colors.primary} />
                <Text style={{ fontSize: 13, color: theme.colors.primary, fontWeight: '500', marginLeft: 6 }}>
                  {t('producer.dashboard.partnerOrders.openPartner')}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.md, marginBottom: theme.spacing.sm }}>
          <Package size={18} color={theme.colors.primary} strokeWidth={1.75} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text.primary, marginLeft: 6 }}>
            {t('producer.dashboard.partnerOrders.threads')}
          </Text>
        </View>
        {threads.length === 0 && !loading ? (
          <Text style={{ fontSize: 14, color: theme.colors.text.secondary, lineHeight: 20 }}>
            {t('producer.dashboard.partnerOrders.emptyThreads')}
          </Text>
        ) : (
          threads.map((th) => (
            <TouchableOpacity
              key={th.id}
              onPress={() =>
                router.push(
                  `/b2b-supplier/${encodeURIComponent(th.supplierUserId)}?threadId=${encodeURIComponent(th.id)}` as Href,
                )
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: theme.colors.surfaceElevated,
                borderRadius: theme.borderRadius.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.sm,
              }}
            >
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: theme.colors.text.primary }}>{resolveThreadTitle(th)}</Text>
                {th.supplier?.material_supplier_profile?.city ? (
                  <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 }}>
                    {[th.supplier.material_supplier_profile.city, th.supplier.material_supplier_profile.country]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                ) : null}
              </View>
              <Text style={{ fontSize: 11, color: theme.colors.text.tertiary }}>
                {new Date(th.lastMessageAt).toLocaleDateString(dateLocale)}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
  );
}
