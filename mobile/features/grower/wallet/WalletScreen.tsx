import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useWallet } from '../../../contexts/WalletContext';
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
  const { wallet, transactions, ordersFinancial, loading, loadError, reload } = useWallet();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (loadError) {
        void reload();
      }
    }, [loadError, reload]),
  );

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

  const showInitialSpinner = loading && !wallet && !loadError;

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
          {showInitialSpinner ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={enterpriseColors.primary} />
            </View>
          ) : null}

          {loadError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{t('producer.wallet.loadError')}</Text>
              <TouchableOpacity
                onPress={() => void reload()}
                style={styles.retryBtn}
                accessibilityRole="button"
              >
                <Text style={styles.retryText}>{t('producer.wallet.retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : wallet ? (
            <>
              <WalletBalanceCard
                availableBalance={wallet.availableBalance}
                pendingBalance={wallet.pendingBalance}
                totalEarned={wallet.totalEarned}
              />

              <GrowerOrdersFinancialSection data={ordersFinancial} />
            </>
          ) : null}

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
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorCard: {
    ...growerUi.emptyCard,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    color: enterpriseColors.gray700,
    lineHeight: 22,
  },
  retryBtn: {
    marginTop: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.primary,
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 12,
  },
});
