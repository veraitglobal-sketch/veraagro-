import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Wallet } from 'lucide-react-native';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { homeStyles, homeUi } from '../../../lib/home-ui';
import { useAppLocaleTag } from '../../../lib/date-locale';
import type { OrdersFinancialSnapshot } from './fetchGrowerOrdersFinancial';

function euro(n: number, locale: string) {
  return n.toLocaleString(locale, { style: 'currency', currency: 'EUR' });
}

export default function DashboardHomeFinanceTeaser({
  data,
  onPress,
}: {
  data: OrdersFinancialSnapshot | null;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const locale = useAppLocaleTag();

  const line =
    data && data.dashboardRole !== 'PLATFORM'
      ? `${euro(data.farmerOrderShareTotal, locale)} · ${t('producer.dashboard.financialOrders.inEscrow')}: ${euro(data.farmerShareInEscrow, locale)}`
      : t('producer.dashboard.homeFinanceTeaserHint');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={homeUi.linkRow} accessibilityRole="button">
      <View style={homeStyles.linkIconWrap}>
        <Wallet size={20} color={enterpriseColors.primary} strokeWidth={1.75} />
      </View>
      <View style={homeStyles.linkContent}>
        <Text style={homeUi.linkTitle}>{t('producer.dashboard.homeFinanceTeaserTitle')}</Text>
        <Text style={homeUi.linkSubtitle} numberOfLines={2}>
          {line}
        </Text>
      </View>
      <ChevronRight size={20} color={enterpriseColors.gray600} strokeWidth={1.75} />
    </TouchableOpacity>
  );
}
