import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  ShoppingBag,
  Store,
  MessageSquare,
  QrCode,
  MapPin,
  AlertCircle,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';
import { useAuth } from '../../hooks/useAuth';
import { b2bSuppliersAPI, notificationsAPI } from '../../lib/api';
import { partnerSignInHref } from '../../lib/post-login-redirect';
import { EnterpriseNavSection } from '../../design-system/EnterpriseNavSection';

type Profile = { businessName?: string; city?: string; mapApproved?: boolean } | null;

export default function SupplierDashboardScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile>(null);
  const [pending, setPending] = useState(0);
  const [open, setOpen] = useState(0);
  const [threads, setThreads] = useState(0);
  const [catalogCount, setCatalogCount] = useState(0);
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [orders, th, prof, catalog, notes] = await Promise.all([
      b2bSuppliersAPI.getIncomingOrders().catch(() => []),
      b2bSuppliersAPI.getMyThreads().catch(() => []),
      b2bSuppliersAPI.getMyProfile().catch(() => null),
      b2bSuppliersAPI.getMyCatalog().catch(() => []),
      notificationsAPI.getAll().catch(() => []),
    ]);
    const list = Array.isArray(orders) ? (orders as { status?: string; farmerReceivedAt?: string | null }[]) : [];
    setPending(list.filter((o) => o.status === 'PENDING').length);
    setOpen(list.filter((o) => o.status === 'CONFIRMED' && !o.farmerReceivedAt).length);
    setThreads(Array.isArray(th) ? th.length : 0);
    setCatalogCount(Array.isArray(catalog) ? catalog.length : 0);
    setUnread(Array.isArray(notes) ? notes.filter((n) => !n.read).length : 0);
    setProfile(prof && typeof prof === 'object' ? (prof as Profile) : null);
  }, []);

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

  if (!user) return null;

  const storeName = profile?.businessName || t('supplier.partnerStore');
  const mapApproved = profile?.mapApproved === true;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={enterpriseColors.primary} />}
    >
      <LinearGradient colors={['#2D5A27', '#1F3D1B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Store size={18} color="#fff" strokeWidth={1.9} />
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(supplier)/notifications')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('notificationsCenter.title')}
            style={styles.bell}
          >
            <Bell size={18} color="#fff" strokeWidth={1.9} />
            {unread > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
        <Text style={styles.heroName} numberOfLines={2}>{storeName}</Text>
        <Text style={styles.heroMeta} numberOfLines={1}>
          {[user.partnerCode, profile?.city].filter(Boolean).join(' · ')}
        </Text>
        <View style={[styles.mapPill, !mapApproved && styles.mapPillPending]}>
          <MapPin size={12} color={mapApproved ? '#fff' : '#F6EDDA'} strokeWidth={2} />
          <Text style={styles.mapPillText}>
            {profile
              ? mapApproved
                ? t('supplier.store.mapApproved')
                : t('supplier.store.mapPending')
              : t('supplier.dashboard.noProfile')}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.kpis}>
        {[
          { key: 'pending', label: t('supplier.dashboard.kpiNew'), value: pending, accent: pending > 0 },
          { key: 'open', label: t('supplier.dashboard.kpiOpen'), value: open },
          { key: 'catalog', label: t('supplier.dashboard.kpiProducts'), value: catalogCount },
        ].map((k, i) => (
          <View key={k.key} style={[styles.kpi, i > 0 && styles.kpiBorder]}>
            <Text style={styles.kpiLabel} numberOfLines={2}>{k.label}</Text>
            <Text style={[styles.kpiValue, k.accent && { color: '#8A5D0F' }]}>{k.value}</Text>
          </View>
        ))}
      </View>

      {pending > 0 ? (
        <TouchableOpacity
          style={styles.alert}
          onPress={() => router.push('/(supplier)/orders' as never)}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <AlertCircle size={18} color="#8A5D0F" strokeWidth={1.9} />
          <Text style={styles.alertText}>{t('supplier.dashboard.pendingAlert', { count: pending })}</Text>
          <ChevronRight size={16} color="#8A5D0F" strokeWidth={2} />
        </TouchableOpacity>
      ) : null}

      <EnterpriseNavSection
        title={t('supplier.dashboard.sectionStore')}
        items={[
          {
            key: 'orders',
            title: t('supplier.ordersFromGrowers'),
            subtitle: t('supplier.dashboard.ordersHint'),
            icon: ShoppingBag,
            tone: 'wheat',
            value: pending + open > 0 ? String(pending + open) : undefined,
            onPress: () => router.push('/(supplier)/orders' as never),
          },
          {
            key: 'catalog',
            title: t('supplier.screenCatalog'),
            subtitle: t('supplier.store.dashboardHint'),
            icon: Store,
            tone: 'green',
            onPress: () => router.push('/(supplier)/catalog' as never),
          },
          {
            key: 'messages',
            title: t('supplier.messagesCard'),
            subtitle: t('supplier.dashboard.messagesHint', { count: threads }),
            icon: MessageSquare,
            tone: 'teal',
            onPress: () => router.push('/(supplier)/messages' as never),
          },
          {
            key: 'badges',
            title: t('supplier.badges.dashboardCard'),
            subtitle: t('supplier.badges.dashboardHint'),
            icon: QrCode,
            tone: 'olive',
            onPress: () => router.push('/(supplier)/badge-handover' as never),
          },
        ]}
      />

      <TouchableOpacity
        onPress={async () => {
          await logout();
          router.replace(partnerSignInHref() as never);
        }}
        style={styles.logout}
        accessibilityRole="button"
      >
        <LogOut size={16} color={enterpriseColors.destructive} strokeWidth={1.9} />
        <Text style={styles.logoutText}>{t('supplier.logOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: enterpriseColors.canvas },
  content: { padding: 16, paddingBottom: 40 },
  hero: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1F3D1B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  heroIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#E5484D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  heroName: { fontSize: 22, fontWeight: '600', letterSpacing: -0.5, color: '#fff' },
  heroMeta: { fontSize: 12.5, color: 'rgba(255,255,255,0.72)', marginTop: 3, fontFamily: 'Menlo' },
  mapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  mapPillPending: { backgroundColor: 'rgba(246, 237, 218, 0.22)' },
  mapPillText: { fontSize: 11.5, fontWeight: '600', color: '#fff' },
  kpis: { ...enterpriseUi.inAppPanel, flexDirection: 'row', paddingVertical: 14, marginBottom: 12 },
  kpi: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  kpiBorder: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: enterpriseColors.gray200 },
  kpiLabel: { fontSize: 12, fontWeight: '500', color: enterpriseColors.gray600, textAlign: 'center' },
  kpiValue: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.6,
    color: enterpriseColors.gray900,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F6EDDA',
    marginBottom: 16,
  },
  alertText: { flex: 1, fontSize: 13.5, fontWeight: '600', color: '#6B470B' },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(185, 28, 28, 0.2)',
    backgroundColor: enterpriseColors.white,
  },
  logoutText: { fontSize: 14.5, fontWeight: '600', color: enterpriseColors.destructive },
});
