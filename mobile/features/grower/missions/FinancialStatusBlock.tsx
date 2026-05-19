import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Euro } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { MissionDetailSection } from './MissionDetailSection';

interface FinancialStatusBlockProps {
  financial: {
    totalAmount?: number;
    farmerPayout?: number;
    paidAmount?: number;
    pendingAmount?: number;
    inEscrowAmount?: number;
    paymentStatus?: string;
    paymentStatusMessage?: string;
    status?: string;
  } | null;
}

function MoneyRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.moneyRow}>
      <Text style={enterpriseUi.navRowSubtitle}>{label}</Text>
      <Text style={[enterpriseUi.navRowTitle, accent && { color: enterpriseColors.primary }]}>{value}</Text>
    </View>
  );
}

export default function FinancialStatusBlock({ financial }: FinancialStatusBlockProps) {
  const { t } = useTranslation();
  const priceLocale = useAppLocaleTag();
  if (!financial) return null;

  const released =
    typeof financial.paidAmount === 'number'
      ? financial.paidAmount
      : typeof financial.farmerPayout === 'number'
        ? financial.farmerPayout
        : null;
  const inEscrow = financial.inEscrowAmount ?? 0;
  const statusLine =
    financial.paymentStatusMessage || financial.paymentStatus || financial.status || '';

  const fmt = (n: number) =>
    n.toLocaleString(priceLocale, { style: 'currency', currency: 'EUR' });

  return (
    <MissionDetailSection title={t('producer.missions.financialStatus')} icon={Euro}>
      {financial.totalAmount != null ? (
        <MoneyRow label={t('producer.missions.total')} value={fmt(financial.totalAmount)} />
      ) : null}
      {released != null ? (
        <MoneyRow label={t('producer.missions.financialReleased')} value={fmt(released)} accent />
      ) : null}
      {inEscrow > 0 ? (
        <MoneyRow label={t('producer.missions.financialInEscrow')} value={fmt(inEscrow)} />
      ) : null}
      {statusLine !== '' ? (
        <Text style={[enterpriseUi.navRowSubtitle, styles.statusLine]}>{statusLine}</Text>
      ) : null}
    </MissionDetailSection>
  );
}

const styles = StyleSheet.create({
  moneyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  statusLine: {
    marginTop: 4,
  },
});
