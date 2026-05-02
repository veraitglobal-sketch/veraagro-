import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useWalletData } from './useWalletData';
import { WalletBalanceCard } from './WalletBalanceCard';
import { TransactionItem } from './TransactionItem';
import GrowerOrdersFinancialSection from '../dashboard/GrowerOrdersFinancialSection';

/**
 * Wallet – prikaz stanja i transakcija (growers).
 * App route: app/(producer)/(tabs)/wallet.tsx renders this screen.
 */
export default function WalletScreen() {
  const { t } = useTranslation();
  const dateLocale = useAppLocaleTag();
  const router = useRouter();
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

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          paddingTop: p.headerTop,
          paddingBottom: theme.spacing.md,
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          backgroundColor: theme.colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(0, 0, 0, 0.08)',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{ marginRight: theme.spacing.md }}
          >
            <ArrowLeft
              size={20}
              color={theme.colors.text.primary}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 0.5,
            }}
          >
            {t('producer.tabs.wallet')}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View
          style={{
            paddingTop: theme.spacing.lg,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.lg),
          }}
        >
          <WalletBalanceCard
            availableBalance={wallet?.availableBalance ?? 0}
            pendingBalance={wallet?.pendingBalance ?? 0}
          />

          <GrowerOrdersFinancialSection data={ordersFinancial} />

          {wallet && (
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.lg,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    letterSpacing: 0.3,
                  }}
                >
                  {t('producer.wallet.totalEarned')}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '300',
                    color: theme.colors.text.primary,
                    letterSpacing: 0.3,
                  }}
                >
                  {wallet.totalEarned.toLocaleString(dateLocale, {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </Text>
              </View>
            </View>
          )}

          <View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '300',
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.md,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
              }}
            >
              {t('producer.wallet.transactions')}
            </Text>

            {transactions.length === 0 ? (
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.xl,
                  alignItems: 'center',
                  borderWidth: 0.5,
                  borderColor: 'rgba(0, 0, 0, 0.05)',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    letterSpacing: 0.3,
                  }}
                >
                  {t('producer.wallet.noTransactions')}
                </Text>
              </View>
            ) : (
              <View style={{ gap: theme.spacing.sm }}>
                {transactions.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
