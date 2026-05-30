import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { useAppLocaleTag } from '../../../lib/date-locale';

interface WalletBalanceCardProps {
  availableBalance: number;
  pendingBalance: number;
  totalEarned?: number;
}

function formatEur(amount: number, locale: string) {
  return amount.toLocaleString(locale, { style: 'currency', currency: 'EUR' });
}

export function WalletBalanceCard({
  availableBalance,
  pendingBalance,
  totalEarned,
}: WalletBalanceCardProps) {
  const { t } = useTranslation();
  const locale = useAppLocaleTag();

  return (
    <View style={styles.card}>
      <Text style={styles.amount}>{formatEur(availableBalance ?? 0, locale)}</Text>
      <Text style={styles.amountLabel}>{t('producer.wallet.available')}</Text>

      <View style={styles.meta}>
        {pendingBalance > 0 ? (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t('producer.wallet.pending')}</Text>
            <Text style={styles.metaValue}>{formatEur(pendingBalance, locale)}</Text>
          </View>
        ) : null}
        {totalEarned != null ? (
          <View style={[styles.metaItem, pendingBalance > 0 && styles.metaItemBorder]}>
            <Text style={styles.metaLabel}>{t('producer.wallet.totalEarned')}</Text>
            <Text style={styles.metaValue}>{formatEur(totalEarned, locale)}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...enterpriseUi.inAppPanel,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    marginBottom: 16,
  },
  amount: {
    fontSize: 34,
    fontWeight: '400',
    color: enterpriseColors.primary,
    letterSpacing: -0.9,
    lineHeight: 40,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 4,
  },
  meta: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
  },
  metaItem: {
    flex: 1,
    minWidth: 0,
  },
  metaItemBorder: {
    paddingLeft: 16,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: enterpriseColors.gray200,
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '500',
    color: enterpriseColors.gray900,
  },
});
