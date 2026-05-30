import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Wallet } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerSheet, growerSheetCardStyle } from '../../../design-system/grower-sheet-styles';

type Props = {
  available: number;
  earned: number;
  pending: number;
  lastTransactionLabel?: string | null;
  loading?: boolean;
  locale: string;
  onPress: () => void;
};

function formatEur(amount: number, locale: string) {
  return amount.toLocaleString(locale, { style: 'currency', currency: 'EUR' });
}

function KpiCell({
  label,
  value,
  loading,
  accent,
  bordered,
}: {
  label: string;
  value: string;
  loading?: boolean;
  accent?: boolean;
  bordered?: boolean;
}) {
  return (
    <View style={[styles.cell, bordered && styles.cellBorder]}>
      <Text style={enterpriseUi.kpiLabel} numberOfLines={2}>
        {label}
      </Text>
      {loading ? (
        <ActivityIndicator size="small" color={enterpriseColors.primary} style={styles.loader} />
      ) : (
        <Text
          style={[enterpriseUi.kpiValue, accent && enterpriseUi.kpiValueAccent]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

/** Unified wallet summary — same rhythm as HomeKpiStrip. */
export function ProfileWalletPanel({
  available,
  earned,
  pending,
  lastTransactionLabel,
  loading = false,
  locale,
  onPress,
}: Props) {
  const { t } = useTranslation();

  const footnote =
    pending > 0
      ? `${t('producer.financial.pending')}: ${formatEur(pending, locale)}`
      : lastTransactionLabel ?? t('producer.profileScreen.walletSubtitle');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={t('producer.profileScreen.walletA11y')}
      style={styles.wrap}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Wallet size={18} color={enterpriseColors.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.headerTitle}>{t('producer.tabs.wallet')}</Text>
        </View>
        <View style={styles.headerAction}>
          <Text style={styles.headerLink}>{t('producer.profileScreen.viewDetails')}</Text>
          <ChevronRight size={18} color={enterpriseColors.gray600} strokeWidth={1.5} />
        </View>
      </View>

      <View style={styles.kpiRow}>
        <KpiCell
          label={t('producer.wallet.available')}
          value={formatEur(available, locale)}
          loading={loading}
          accent={available > 0}
          bordered
        />
        <KpiCell
          label={t('producer.financial.totalEarned')}
          value={formatEur(earned, locale)}
          loading={loading}
          accent={earned > 0}
        />
      </View>

      <Text style={styles.footnote} numberOfLines={2}>
        {footnote}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...growerSheetCardStyle({ marginBottom: 20 }),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: growerSheet.cardBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: growerSheet.iconBg,
    borderWidth: 1,
    borderColor: growerSheet.iconBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: growerSheet.title,
    letterSpacing: -0.25,
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerLink: {
    fontSize: 14,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    letterSpacing: -0.1,
  },
  kpiRow: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 8,
    minHeight: 88,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  cellBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(45, 90, 39, 0.1)',
  },
  loader: {
    marginTop: 8,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    lineHeight: 18,
    paddingHorizontal: 18,
    paddingBottom: 16,
    letterSpacing: -0.05,
  },
});
