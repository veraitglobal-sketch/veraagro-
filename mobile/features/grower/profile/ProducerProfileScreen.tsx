import { useMemo } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { FileCheck, Settings, LogOut, ShoppingCart, RotateCcw } from 'lucide-react-native';
import { GrowerHeroSheetScaffold, EnterpriseNavSection } from '../../../design-system';
import { EnterprisePanel } from '../../../design-system/EnterprisePanel';
import { GrowerHeroTopBar } from '../../../components/enterprise/GrowerHeroTopBar';
import { GrowerPersonHero } from '../../../components/enterprise/GrowerPersonHero';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { useProducerProfileData } from './useProducerProfileData';
import { ProfileWalletPanel } from './ProfileWalletPanel';

export default function ProducerProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const data = useProducerProfileData();
  const locale = useAppLocaleTag();

  const available = data.wallet?.availableBalance ?? 0;
  const earned = data.wallet?.totalEarned ?? 0;
  const pending = data.wallet?.pendingBalance ?? 0;

  const lastTransactionLabel = data.lastTransaction
    ? `${data.lastTransaction.description || '—'} · ${Math.abs(data.lastTransaction.amount).toLocaleString(locale, {
        style: 'currency',
        currency: 'EUR',
      })}`
    : null;

  const accountItems = useMemo(
    () => [
      {
        key: 'buyer-orders',
        title: t('producer.orders.menuTitle'),
        subtitle: t('producer.orders.menuSubtitle'),
        icon: ShoppingCart,
        onPress: () => router.push('/(producer)/orders'),
      },
      {
        key: 'settings',
        title: t('producer.tabs.settings'),
        subtitle: t('producer.profileScreen.settingsSubtitle'),
        icon: Settings,
        onPress: () => router.push('/(producer)/(tabs)/settings'),
      },
      {
        key: 'returns', title: t('returnFlow.title'), subtitle: t('returnFlow.menuSubtitle'), icon: RotateCcw,
        onPress: () => router.push('/(producer)/returns'),
      },
      {
        key: 'compliance',
        title: t('producer.profile.compliance.navTitle'),
        subtitle: t('producer.profile.compliance.navDesc'),
        icon: FileCheck,
        onPress: () => router.push('/(producer)/compliance'),
      },
    ],
    [t, router],
  );

  return (
    <GrowerHeroSheetScaffold
      heroCompact
      topBar={<GrowerHeroTopBar />}
      hero={
        <GrowerPersonHero
          compact
          name={data.displayName}
          email={data.user?.email}
          partnerCode={data.user?.partnerCode}
          photoUri={data.profilePhoto}
        />
      }
      refreshing={data.refreshing}
      onRefresh={() => void data.onRefresh()}
    >
      <ProfileWalletPanel
        available={available}
        earned={earned}
        pending={pending}
        lastTransactionLabel={lastTransactionLabel}
        loading={data.walletLoading}
        locale={locale}
        onPress={data.openWallet}
      />

      <EnterpriseNavSection title={t('producer.profile.sectionAccount')} items={accountItems} />

      <EnterpriseNavSection title={t('producer.dashboard.moreSection')} items={data.moreItems} />

      <EnterprisePanel variant="default" padding="none" style={styles.logoutPanel}>
        <TouchableOpacity
          onPress={() => void data.handleLogout()}
          activeOpacity={0.72}
          accessibilityRole="button"
          style={styles.logoutRow}
        >
          <LogOut size={20} color={enterpriseColors.destructive} strokeWidth={1.5} />
          <Text style={styles.logoutText}>{t('supplier.logOut')}</Text>
        </TouchableOpacity>
      </EnterprisePanel>
    </GrowerHeroSheetScaffold>
  );
}

const styles = StyleSheet.create({
  logoutPanel: {
    marginBottom: 8,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: enterpriseColors.destructive,
    letterSpacing: -0.2,
  },
});
