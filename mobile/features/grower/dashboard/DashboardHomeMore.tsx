import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react-native';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { homeUi } from '../../../lib/home-ui';
import DashboardHomeFinanceTeaser from './DashboardHomeFinanceTeaser';
import type { OrdersFinancialSnapshot } from './fetchGrowerOrdersFinancial';

function LinkRow({
  title,
  subtitle,
  onPress,
  tinted,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
  tinted?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={[homeUi.linkRow, tinted ? homeUi.linkRowTinted : null]}
      accessibilityRole="button"
    >
      <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
        <Text style={[homeUi.linkTitle, tinted ? { color: enterpriseColors.primary } : null]}>{title}</Text>
        <Text style={homeUi.linkSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={20} color={enterpriseColors.gray600} strokeWidth={1.75} />
    </TouchableOpacity>
  );
}

/** Wallet + season + education — home extras, not tab duplicates. */
export default function DashboardHomeMore({
  ordersFinancial,
}: {
  ordersFinancial: OrdersFinancialSnapshot | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={{ marginTop: 4 }}>
      <DashboardHomeFinanceTeaser
        data={ordersFinancial}
        onPress={() => router.push('/(producer)/(tabs)/wallet')}
      />
      <LinkRow
        title={t('producer.dashboard.seasonGuideTitle')}
        subtitle={t('producer.dashboard.seasonGuideSubtitle')}
        onPress={() => router.push('/(producer)/(tabs)/steps')}
      />
      <LinkRow
        title={t('producer.dashboard.educationBannerTitle')}
        subtitle={t('producer.dashboard.educationBannerSubtitle')}
        onPress={() => router.push('/(producer)/education')}
        tinted
      />
    </View>
  );
}
