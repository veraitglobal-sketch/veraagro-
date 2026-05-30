import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Bell, BookOpen, Sparkles } from 'lucide-react-native';
import { useAuth } from '../../../hooks/useAuth';
import { offlineStorage } from '../../../lib/offline-storage';
import { partnerSignInHref } from '../../../lib/post-login-redirect';
import { tString } from '../../../lib/i18n-strings';
import { farmerProfileAPI } from '../../../lib/api/grower';
import { useWalletData } from '../wallet/useWalletData';

export function useProducerProfileData() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { wallet, transactions, loading: walletLoading, reload: reloadWallet } = useWalletData();

  const lastTransaction = transactions.length > 0 ? transactions[0] : null;
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—';

  const refreshPending = useCallback(async () => {
    const entries = await offlineStorage.getPendingEntries();
    setPendingCount(entries.filter((e) => e.status === 'pending').length);
  }, []);

  const refreshProfilePhoto = useCallback(async () => {
    try {
      const profile = await farmerProfileAPI.getMyProfile();
      setProfilePhoto(profile.farmer?.photo ?? null);
    } catch {
      setProfilePhoto(null);
    }
  }, []);

  useEffect(() => {
    void refreshPending();
    void refreshProfilePhoto();
  }, [refreshPending, refreshProfilePhoto]);

  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([refreshPending(), reloadWallet(), refreshProfilePhoto()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshPending, reloadWallet, refreshProfilePhoto, refreshing]);

  const moreItems = useMemo(
    () => [
      {
        key: 'notifications',
        title: t('producer.liveInfo.notifications'),
        subtitle:
          pendingCount > 0
            ? tString(t, 'producer.dashboard.syncStrip.pendingLine', { count: pendingCount })
            : t('notificationsCenter.subtitle'),
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
        key: 'vera-insights',
        title: t('producer.dashboard.veraInsights'),
        subtitle: t('producer.dashboard.veraInsightsDesc'),
        icon: Sparkles,
        onPress: () => router.push('/(producer)/vera-insights'),
      },
    ],
    [t, router, pendingCount],
  );

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace(partnerSignInHref() as never);
  }, [logout, router]);

  return {
    user,
    displayName,
    profilePhoto,
    wallet,
    walletLoading,
    lastTransaction,
    refreshing,
    onRefresh,
    moreItems,
    handleLogout,
    openWallet: () => router.push('/(producer)/wallet'),
  };
}
