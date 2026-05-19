import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { GrowerTabHeader } from '../../../components/grower/GrowerTabHeader';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { EnterpriseListPanel } from '../../../components/grower/EnterpriseListPanel';
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
    setRefreshing(true);
    try {
      await Promise.all([refreshPending(), reloadWallet()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshPending, reloadWallet]);

  const menuItems = useMemo(
    () => [
      {
        key: 'notifications',
        label: t('notificationsCenter.title'),
        onPress: () => router.push('/(producer)/notifications'),
      },
      {
        key: 'settings',
        label: t('producer.tabs.settings'),
        onPress: () => router.push('/(producer)/(tabs)/settings'),
      },
    ],
    [t, router],
  );

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—';

  return (
    <EnterpriseScreen
      withTopWash
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
      contentPaddingBottom={Math.max(pad.bottomInset, 20) + 12}
      header={
        <GrowerTabHeader
          title={t('producer.tabs.profile')}
          subtitle={user?.email ?? undefined}
          style={{ paddingTop: 12 }}
        />
      }
    >
      <View style={styles.body}>
        <Text style={styles.name} accessibilityRole="header">
          {displayName}
        </Text>
        {user?.partnerCode ? (
          <Text style={styles.code}>{user.partnerCode}</Text>
        ) : null}
        {pendingCount > 0 ? (
          <TouchableOpacity
            onPress={() => router.push('/(producer)/(tabs)/field-log')}
            activeOpacity={0.88}
            style={styles.pending}
            accessibilityRole="button"
          >
            <View style={styles.pendingDot} />
            <Text style={styles.pendingText}>
              {tString(t, 'producer.dashboard.syncStrip.pendingLine', { count: pendingCount })}
            </Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.walletWrap}>
          <ProfileWalletPreview
            wallet={wallet}
            loading={walletLoading}
            lastTransaction={lastTransaction}
            onPress={() => router.push('/(producer)/(tabs)/wallet')}
          />
        </View>

        <View style={styles.menuWrap}>
          <EnterpriseListPanel items={menuItems} />
        </View>

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
      </View>
    </EnterpriseScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  name: {
    fontSize: 32,
    fontWeight: '300',
    color: enterpriseColors.gray900,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  code: {
    fontSize: 12,
    fontWeight: '600',
    color: enterpriseColors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 10,
  },
  email: {
    fontSize: 15,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 6,
    letterSpacing: -0.15,
  },
  pending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
    backgroundColor: 'rgba(254, 243, 199, 0.5)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  pendingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    letterSpacing: -0.15,
    lineHeight: 22,
  },
  walletWrap: {
    marginTop: 24,
  },
  menuWrap: {
    marginTop: 20,
  },
  logout: {
    alignSelf: 'flex-start',
    marginTop: 36,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    letterSpacing: -0.15,
  },
});
