import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { TabRootBody } from '../../../components/enterprise/TabRootBody';
import { EnterpriseNavSection } from '../../../components/enterprise/EnterpriseNavSection';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { Bell, BookOpen, Settings, Wallet } from 'lucide-react-native';
import { offlineStorage } from '../../../lib/offline-storage';
import { partnerSignInHref } from '../../../lib/post-login-redirect';
import { tString } from '../../../lib/i18n-strings';
import { useWalletData } from '../wallet/useWalletData';
import { ProfileWalletPreview } from './ProfileWalletPreview';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pad = useBioVeraScreenPadding();
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const { wallet, transactions, loading: walletLoading, reload: reloadWallet } = useWalletData();

  const lastTransaction = transactions.length > 0 ? transactions[0] : null;

  const refreshPending = useCallback(async () => {
    const entries = await offlineStorage.getPendingEntries();
    setPendingCount(entries.filter((e) => e.status === 'pending').length);
  }, []);

  useEffect(() => {
    void refreshPending();
  }, [refreshPending]);

  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([refreshPending(), reloadWallet()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshPending, reloadWallet, refreshing]);

  const menuItems = useMemo(
    () => [
      {
        key: 'wallet',
        title: t('producer.dashboard.homeFinanceTeaserTitle'),
        subtitle: t('producer.dashboard.homeFinanceTeaserHint'),
        icon: Wallet,
        onPress: () => router.push('/(producer)/(tabs)/wallet'),
      },
      {
        key: 'notifications',
        title: t('notificationsCenter.title'),
        subtitle:
          pendingCount > 0
            ? tString(t, 'producer.dashboard.syncStrip.pendingLine', { count: pendingCount })
            : undefined,
        icon: Bell,
        onPress: () => router.push('/(producer)/notifications'),
      },
      {
        key: 'education',
        title: t('producer.dashboard.educationBannerTitle'),
        subtitle: t('producer.dashboard.educationBannerSubtitle'),
        icon: BookOpen,
        onPress: () => router.push('/(producer)/education'),
      },
      {
        key: 'settings',
        title: t('producer.tabs.settings'),
        subtitle: user?.email ?? undefined,
        icon: Settings,
        onPress: () => router.push('/(producer)/(tabs)/settings'),
      },
    ],
    [t, router, user?.email, pendingCount],
  );

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—';

  return (
    <EnterpriseScreen
      fillViewport
      withTopWash
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
      contentPaddingBottom={Math.max(pad.bottomInset, 20) + 12}
    >
      <TabRootBody style={{ paddingTop: pad.headerTop }}>
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={2} accessibilityRole="header">
            {displayName}
          </Text>
          {user?.email ? (
            <Text style={styles.email} numberOfLines={1}>
              {user.email}
            </Text>
          ) : null}
          {user?.partnerCode ? (
            <Text style={styles.partner} numberOfLines={1}>
              {t('producer.dashboard.partner')} {user.partnerCode}
            </Text>
          ) : null}
        </View>

        <View style={styles.walletWrap}>
          <ProfileWalletPreview
            wallet={wallet}
            loading={walletLoading}
            lastTransaction={lastTransaction}
            onPress={() => router.push('/(producer)/(tabs)/wallet')}
          />
        </View>

        <EnterpriseNavSection title={t('producer.dashboard.moreSection')} items={menuItems} />

        <TouchableOpacity
          onPress={async () => {
            await logout();
            router.replace(partnerSignInHref() as never);
          }}
          activeOpacity={0.6}
          style={styles.logout}
          accessibilityRole="button"
        >
          <Text style={styles.logoutText}>{t('supplier.logOut')}</Text>
        </TouchableOpacity>
      </TabRootBody>
    </EnterpriseScreen>
  );
}

const styles = StyleSheet.create({
  identity: {
    marginBottom: 18,
  },
  name: {
    fontSize: 28,
    fontWeight: '300',
    color: enterpriseColors.gray900,
    letterSpacing: -0.65,
    lineHeight: 34,
  },
  email: {
    fontSize: 15,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 6,
    letterSpacing: -0.15,
  },
  partner: {
    fontSize: 13,
    fontWeight: '500',
    color: enterpriseColors.primary,
    marginTop: 8,
    letterSpacing: -0.05,
  },
  walletWrap: {
    marginBottom: 14,
  },
  logout: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 10,
    minHeight: 48,
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    letterSpacing: -0.15,
  },
});
