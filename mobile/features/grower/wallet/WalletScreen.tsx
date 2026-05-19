import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useWalletData } from './useWalletData';
import { WalletBalanceCard } from './WalletBalanceCard';
import { TransactionItem } from './TransactionItem';
import GrowerOrdersFinancialSection from '../dashboard/GrowerOrdersFinancialSection';

/**
 * Wallet – stanje i transakcije (grower).
 */
export default function WalletScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = useBioVeraScreenPadding();
  const { wallet, transactions, ordersFinancial, loading, reload } = useWalletData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(producer)/(tabs)/profile');
    }
  };

  if (loading && !wallet) {
    return (
      <View style={[growerUi.canvas, styles.centered]}>
        <ActivityIndicator size="large" color={enterpriseColors.primary} />
      </View>
    );
  }

  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader
        title={t('producer.tabs.wallet')}
        subtitle={t('producer.profileScreen.walletSubtitle')}
        onBack={goBack}
      />
      <EnterpriseScreen
        refreshing={refreshing}
        onRefresh={() => void onRefresh()}
        contentPaddingBottom={Math.max(insets.bottom, p.bottomInset, 16) + 58}
      >
        <View style={growerUi.scrollContent}>
          <WalletBalanceCard
            availableBalance={wallet?.availableBalance ?? 0}
            pendingBalance={wallet?.pendingBalance ?? 0}
            totalEarned={wallet?.totalEarned}
          />

          <GrowerOrdersFinancialSection data={ordersFinancial} />

          <Text style={[enterpriseUi.inAppSectionLabel, styles.sectionLabel]}>
            {t('producer.wallet.transactions')}
          </Text>

          {transactions.length === 0 ? (
            <View style={growerUi.emptyCard}>
              <Text style={enterpriseUi.navRowSubtitle}>{t('producer.wallet.noTransactions')}</Text>
            </View>
          ) : (
            transactions.map((tx) => <TransactionItem key={tx.id} transaction={tx} />)
          )}
        </View>
      </EnterpriseScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 12,
  },
});
