import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { ShoppingBag, CheckCircle2 } from 'lucide-react-native';
import { b2bSuppliersAPI } from '../../lib/api';
import { apiErrorMessage } from '../../lib/api-error';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';
import { growerUi } from '../../lib/grower-ui';
import { useAppLocaleTag } from '../../lib/date-locale';
import EmptyState from '../../components/EmptyState';

type Status = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'FULFILLED' | 'CANCELLED';
type Filter = 'open' | 'all';

/** Mirrors the backend workflow — only the next legal steps are offered. */
const ACTIONS: Record<string, { status: Status; primary?: boolean; confirm?: boolean }[]> = {
  PENDING: [
    { status: 'CONFIRMED', primary: true },
    { status: 'REJECTED', confirm: true },
  ],
  CONFIRMED: [
    { status: 'FULFILLED', primary: true },
    { status: 'CANCELLED', confirm: true },
  ],
};

const TONE: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: '#F6EDDA', fg: '#8A5D0F' },
  CONFIRMED: { bg: '#E1EFEC', fg: '#1D665D' },
  FULFILLED: { bg: '#E8F1E4', fg: '#2D5A27' },
  REJECTED: { bg: '#FBE9E7', fg: '#B42318' },
  CANCELLED: { bg: '#ECEEF1', fg: '#475467' },
};

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

function statusLabel(status: string | undefined, t: TFunction): string {
  if (!status) return '—';
  const key = `supplier.b2bOrderStatus.${status}`;
  const tr = t(key);
  return tr === key ? status : tr;
}

export default function SupplierOrdersScreen() {
  const { t } = useTranslation();
  const dateLocale = useAppLocaleTag();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('open');

  const load = useCallback(async () => {
    try {
      const data = await b2bSuppliersAPI.getIncomingOrders();
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert(t('error'), apiErrorMessage(e, t('supplier.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const apply = (orderId: string, status: Status) => {
    void (async () => {
      setBusyId(orderId);
      try {
        await b2bSuppliersAPI.patchOrderStatus(orderId, { status });
        await load();
      } catch (e) {
        Alert.alert(t('error'), apiErrorMessage(e, t('supplier.updateFailed')));
      } finally {
        setBusyId(null);
      }
    })();
  };

  const onAction = (orderId: string, action: { status: Status; confirm?: boolean }) => {
    if (!action.confirm) return apply(orderId, action.status);
    Alert.alert(t(`supplier.orderActions.confirm_${action.status}`), t('supplier.orderActions.confirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t(`supplier.orderActions.${action.status}`), style: 'destructive', onPress: () => apply(orderId, action.status) },
    ]);
  };

  const visible = filter === 'open' ? list.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED') : list;
  const openCount = list.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED').length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={enterpriseColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={enterpriseColors.primary} />}
    >
      <View style={styles.filters}>
        {(['open', 'all'] as const).map((f) => {
          const on = filter === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
              style={[growerUi.filterChip, on && growerUi.filterChipOn]}
            >
              <Text style={[growerUi.filterChipText, on && growerUi.filterChipTextOn]}>
                {f === 'open' ? t('supplier.orderActions.filterOpen', { count: openCount }) : t('supplier.orderActions.filterAll')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {visible.length === 0 ? (
        <EmptyState message={t('supplier.noOrdersYet')} icon={ShoppingBag} />
      ) : (
        visible.map((o) => {
          const lines = orderLinesFromItems(o.items, t);
          const tone = TONE[o.status] ?? TONE.CANCELLED;
          const farmer = o.farmer
            ? [`${o.farmer.firstName || ''} ${o.farmer.lastName || ''}`.trim(), o.farmer.partnerCode].filter(Boolean).join(' · ')
            : t('supplier.growerFallback');
          const actions = o.farmerReceivedAt ? [] : ACTIONS[o.status] ?? [];
          return (
            <View key={o.id} style={styles.card}>
              <View style={styles.head}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.farmer} numberOfLines={1}>{farmer}</Text>
                  <Text style={styles.ref} numberOfLines={1}>
                    #{String(o.id).slice(0, 8).toUpperCase()} · {o.createdAt ? new Date(o.createdAt).toLocaleString(dateLocale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                </View>
                <View style={[styles.pill, { backgroundColor: tone.bg }]}>
                  <Text style={[styles.pillText, { color: tone.fg }]}>{statusLabel(o.status, t)}</Text>
                </View>
              </View>

              {lines.length > 0 ? (
                <View style={styles.lines}>
                  {lines.map((line, i) => (
                    <Text key={i} style={styles.line}>{line}</Text>
                  ))}
                </View>
              ) : null}
              {o.noteFromFarmer ? <Text style={styles.note}>“{o.noteFromFarmer}”</Text> : null}

              {o.farmerReceivedAt ? (
                <View style={styles.received}>
                  <CheckCircle2 size={14} color={enterpriseColors.primary} strokeWidth={2} />
                  <Text style={styles.receivedText}>
                    {t('supplier.growerReceivedAtFarm', { when: new Date(o.farmerReceivedAt).toLocaleString(dateLocale) })}
                  </Text>
                </View>
              ) : null}

              {actions.length > 0 ? (
                <View style={styles.actions}>
                  {actions.map((a) => (
                    <TouchableOpacity
                      key={a.status}
                      onPress={() => onAction(o.id, a)}
                      disabled={busyId === o.id}
                      activeOpacity={0.8}
                      style={[a.primary ? styles.primaryBtn : styles.secondaryBtn, busyId === o.id && { opacity: 0.6 }]}
                      accessibilityRole="button"
                    >
                      {busyId === o.id && a.primary ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={a.primary ? styles.primaryText : styles.secondaryText}>
                          {t(`supplier.orderActions.${a.status}`)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: enterpriseColors.canvas },
  content: { padding: 16, paddingBottom: 40, gap: 10 },
  center: { flex: 1, justifyContent: 'center', backgroundColor: enterpriseColors.canvas },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 2 },
  card: { ...enterpriseUi.inAppPanel, padding: 14 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  farmer: { fontSize: 15, fontWeight: '600', letterSpacing: -0.25, color: enterpriseColors.gray900 },
  ref: { fontSize: 11.5, color: enterpriseColors.gray600, fontFamily: 'Menlo', marginTop: 2 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillText: { fontSize: 11, fontWeight: '600' },
  lines: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
    gap: 3,
  },
  line: { fontSize: 14, color: enterpriseColors.gray900, fontVariant: ['tabular-nums'] },
  note: { fontSize: 12.5, color: enterpriseColors.gray600, fontStyle: 'italic', marginTop: 6 },
  received: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  receivedText: { fontSize: 12.5, color: enterpriseColors.primary, fontWeight: '500', flex: 1 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  primaryBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: enterpriseColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  secondaryBtn: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.12)',
    backgroundColor: enterpriseColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontSize: 14, fontWeight: '600', color: enterpriseColors.gray700 },
});
