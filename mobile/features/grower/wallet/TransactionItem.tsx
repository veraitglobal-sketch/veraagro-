import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, Calendar } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { useAppLocaleTag } from '../../../lib/date-locale';
import type { Transaction } from './useWalletData';

interface TransactionItemProps {
  transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const dateLocale = useAppLocaleTag();
  const { t } = useTranslation();
  const router = useRouter();
  const isCredit = transaction.type === 'CREDIT';
  const amountColor = isCredit ? enterpriseColors.primary : enterpriseColors.destructive;

  return (
    <TouchableOpacity style={[enterpriseUi.inAppPanel, styles.row]} disabled={!transaction.orderId}
      accessibilityRole={transaction.orderId ? 'button' : undefined}
      accessibilityHint={transaction.orderId ? t('connectedWorkflow.openOrder') : undefined}
      onPress={() => transaction.orderId && router.push({ pathname: '/(producer)/orders/[id]', params: { id: transaction.orderId } })}>
      <View style={[styles.iconWell, { backgroundColor: enterpriseColors.gray100 }]}>
        {isCredit ? (
          <ArrowDownLeft size={20} color={enterpriseColors.primary} strokeWidth={1.5} />
        ) : (
          <ArrowUpRight size={20} color={enterpriseColors.destructive} strokeWidth={1.5} />
        )}
      </View>
      <View style={styles.body}>
        <Text style={enterpriseUi.navRowTitle} numberOfLines={2}>
          {transaction.sourceType === 'REFUNDED' ? t('refundReconciliation.walletEntry') : transaction.description}
        </Text>
        {transaction.sourceType === 'REFUNDED' && transaction.orderId ? <Text style={enterpriseUi.navRowSubtitle}>{t('refundReconciliation.orderReference')}: {transaction.orderId}</Text> : null}
        <View style={styles.dateRow}>
          <Calendar size={12} color={enterpriseColors.gray600} strokeWidth={1} />
          <Text style={enterpriseUi.navRowSubtitle}>
            {new Date(transaction.createdAt).toLocaleDateString(dateLocale)}
          </Text>
        </View>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {isCredit ? '+' : '-'}
        {transaction.amount.toLocaleString(dateLocale, {
          style: 'currency',
          currency: 'EUR',
        })}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
  },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  body: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
});
