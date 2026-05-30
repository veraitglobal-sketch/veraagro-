import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GlassSurface } from '../../../design-system/GlassSurface';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { useAppLocaleTag } from '../../../lib/date-locale';
import type { WalletData, Transaction } from '../wallet/useWalletData';

function formatEur(amount: number, locale: string) {
  return amount.toLocaleString(locale, { style: 'currency', currency: 'EUR' });
}

type Props = {
  wallet: WalletData | null;
  loading: boolean;
  lastTransaction: Transaction | null;
  onPress: () => void;
};

export function WalletCard({ wallet, loading, lastTransaction, onPress }: Props) {
  const { t } = useTranslation();
  const locale = useAppLocaleTag();

  const available = wallet?.availableBalance ?? 0;
  const pending = wallet?.pendingBalance ?? 0;
  const earned = wallet?.totalEarned ?? 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.72}
      accessibilityRole="button"
      accessibilityLabel={t('producer.profileScreen.walletA11y')}
    >
      <GlassSurface contentStyle={styles.cardInner} blur={44}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('producer.tabs.wallet')}</Text>
          <Text style={styles.subtitle}>{t('producer.wallet.subtitle')}</Text>
        </View>
        <Text style={styles.detailText}>{t('producer.profileScreen.viewDetails')}</Text>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={enterpriseColors.primary} />
        </View>
      ) : (
        <>
          <Text style={styles.amount}>{formatEur(available, locale)}</Text>
          <Text style={styles.amountLabel}>{t('producer.wallet.available')}</Text>

          <View style={styles.meta}>
            {pending > 0 ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('producer.financial.pending')}</Text>
                <Text style={styles.metaValue}>{formatEur(pending, locale)}</Text>
              </View>
            ) : null}
            <View style={[styles.metaItem, pending > 0 && styles.metaItemBorder]}>
              <Text style={styles.metaLabel}>{t('producer.financial.totalEarned')}</Text>
              <Text style={styles.metaValue}>{formatEur(earned, locale)}</Text>
            </View>
          </View>

          {lastTransaction ? (
            <View style={styles.lastTx}>
              <Text style={styles.lastTxLabel}>{t('producer.profileScreen.lastTransaction')}</Text>
              <Text style={styles.lastTxValue} numberOfLines={1}>
                {lastTransaction.description || '—'} ·{' '}
                {formatEur(Math.abs(lastTransaction.amount), locale)}
              </Text>
            </View>
          ) : null}
        </>
      )}
      </GlassSurface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardInner: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    letterSpacing: -0.05,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '500',
    color: enterpriseColors.primary,
    letterSpacing: -0.1,
  },
  loading: {
    minHeight: 72,
    justifyContent: 'center',
    alignItems: 'flex-start',
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
  lastTx: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
  },
  lastTxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: enterpriseColors.gray600,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  lastTxValue: {
    fontSize: 14,
    fontWeight: '400',
    color: enterpriseColors.gray700,
  },
});
