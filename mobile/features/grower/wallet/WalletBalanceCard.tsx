import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Wallet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
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
    <LinearGradient
      colors={['#2D5A27', '#1F3D1B']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <Text style={styles.amountLabel}>{t('producer.wallet.available')}</Text>
        <View style={styles.badge}>
          <Wallet size={15} color="#fff" strokeWidth={1.9} />
        </View>
      </View>
      <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
        {formatEur(availableBalance ?? 0, locale)}
      </Text>

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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 16,
    shadowColor: '#1F3D1B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -1,
    lineHeight: 38,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.72)',
  },
  meta: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  metaItem: {
    flex: 1,
    minWidth: 0,
  },
  metaItemBorder: {
    paddingLeft: 14,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.66)',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
});
