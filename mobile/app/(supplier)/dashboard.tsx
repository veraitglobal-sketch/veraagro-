import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Bell, ShoppingBag } from 'lucide-react-native';
import { enterpriseColors } from '../../lib/enterprise-ui';
import { useAuth } from '../../hooks/useAuth';
import { b2bSuppliersAPI, notificationsAPI } from '../../lib/api';
import { theme } from '../../lib/theme';
import { partnerSignInHref } from '../../lib/post-login-redirect';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';

export default function SupplierDashboardScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const [orders, setOrders] = useState(0);
  const [threads, setThreads] = useState(0);
  const [catalogCount, setCatalogCount] = useState(0);
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        try {
          const data = await notificationsAPI.getAll();
          const unread = Array.isArray(data) ? data.filter((n) => !n.read).length : 0;
          if (!cancelled) setUnreadNotifications(unread);
        } catch {
          if (!cancelled) setUnreadNotifications(0);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  useEffect(() => {
    (async () => {
      try {
        const [o, th, p, catalog] = await Promise.all([
          b2bSuppliersAPI.getIncomingOrders(),
          b2bSuppliersAPI.getMyThreads(),
          b2bSuppliersAPI.getMyProfile().catch(() => null),
          b2bSuppliersAPI.getMyCatalog().catch(() => []),
        ]);
        setOrders(Array.isArray(o) ? o.length : 0);
        setThreads(Array.isArray(th) ? th.length : 0);
        setCatalogCount(Array.isArray(catalog) ? catalog.length : 0);
        if (p && typeof p === 'object' && p !== null && 'businessName' in p) {
          setName(String((p as { businessName?: string }).businessName || ''));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!user) {
    return null;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingTop: p.headerTop,
          paddingBottom: theme.spacing.sm,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push('/(supplier)/notifications')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('notificationsCenter.title')}
          style={{ padding: theme.spacing.xs }}
        >
          <View style={{ position: 'relative' }}>
            <Bell size={22} color={theme.colors.text.primary} strokeWidth={1.5} />
            {unreadNotifications > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -7,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: theme.colors.error,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '600', color: theme.colors.background }}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color={theme.colors.primary} style={{ marginBottom: 12 }} />}
      <Text style={{ fontSize: 22, fontWeight: '300', color: theme.colors.text.primary, marginBottom: 4 }}>
        {name || t('supplier.partnerStore')}
      </Text>
      <Text style={{ fontSize: 13, color: theme.colors.text.secondary, marginBottom: 20 }}>
        {user.firstName} · {user.partnerCode}
      </Text>

      <TouchableOpacity
        onPress={() => router.push('/(supplier)/catalog' as any)}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: 18,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: enterpriseColors.gray200,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <ShoppingBag size={18} color={enterpriseColors.primary} strokeWidth={1.5} />
          <Text style={{ fontSize: 15, fontWeight: '500', color: theme.colors.text.primary }}>
            {t('supplier.screenCatalog')}
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: theme.colors.text.secondary, marginBottom: 6 }}>
          {t('supplier.store.dashboardHint')}
        </Text>
        <Text style={{ fontSize: 28, fontWeight: '300', color: enterpriseColors.primary }}>{catalogCount}</Text>
      </TouchableOpacity>

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
        <Text style={{ fontSize: 15, fontWeight: '500', color: theme.colors.text.primary }}>{t('supplier.ordersFromGrowers')}</Text>
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
        <Text style={{ fontSize: 15, fontWeight: '500', color: theme.colors.text.primary }}>{t('supplier.messagesCard')}</Text>
        <Text style={{ fontSize: 28, fontWeight: '300', color: theme.colors.primary, marginTop: 4 }}>{threads}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={async () => {
          await logout();
          router.replace(partnerSignInHref() as any);
        }}
        style={{ padding: 12 }}
      >
        <Text style={{ color: '#B91C1C', textAlign: 'center', fontSize: 15 }}>{t('supplier.logOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
