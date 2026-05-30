import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { FileCheck, ShieldAlert } from 'lucide-react-native';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { TabRootBody } from '../../../components/enterprise/TabRootBody';
import { EnterpriseNavSection } from '../../../components/enterprise/EnterpriseNavSection';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { WalletCard } from './WalletCard';
import { QuickAccessGrid } from './QuickAccessGrid';
import { useProducerProfileData } from './useProducerProfileData';

export default function ProducerProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const pad = useBioVeraScreenPadding();
  const data = useProducerProfileData();

  const complianceItems = [
    {
      key: 'certifications',
      title: t('producer.tabs.certifications'),
      subtitle: t('producer.dashboard.certificationsDesc'),
      icon: FileCheck,
      onPress: () => router.push('/(producer)/(tabs)/certifications'),
    },
    {
      key: 'banned-substances',
      title: t('producer.tabs.bannedSubstances'),
      subtitle: t('producer.dashboard.bannedSubstancesDesc'),
      icon: ShieldAlert,
      onPress: () => router.push('/(producer)/(tabs)/banned-substances'),
    },
  ];

  return (
    <EnterpriseScreen
      fillViewport
      withTopWash
      refreshing={data.refreshing}
      onRefresh={() => void data.onRefresh()}
      contentPaddingBottom={100}
    >
      <TabRootBody style={{ paddingTop: pad.headerTop }}>
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={2} accessibilityRole="header">
            {data.displayName}
          </Text>
          {data.user?.email ? (
            <Text style={styles.email} numberOfLines={1}>
              {data.user.email}
            </Text>
          ) : null}
          {data.user?.partnerCode ? (
            <Text style={styles.partner} numberOfLines={1}>
              {t('producer.dashboard.partner')} {data.user.partnerCode}
            </Text>
          ) : null}
        </View>

        <View style={styles.walletWrap}>
          <WalletCard
            wallet={data.wallet}
            loading={data.walletLoading}
            lastTransaction={data.lastTransaction}
            onPress={data.openWallet}
          />
        </View>

        <QuickAccessGrid />

        <EnterpriseNavSection title={t('producer.profile.sectionCompliance')} items={complianceItems} />

        <EnterpriseNavSection title={t('producer.dashboard.moreSection')} items={data.moreItems} />

        <TouchableOpacity
          onPress={() => void data.handleLogout()}
          activeOpacity={0.6}
          style={styles.logout}
          accessibilityRole="button"
        >
          <Text style={styles.logoutText}>{t('supplier.logOut')}</Text>
        </TouchableOpacity>
      </TabRootBody>
    </EnterpriseScreen>
  );
}

const styles = StyleSheet.create({
  identity: {
    marginBottom: 18,
  },
  name: {
    fontSize: 28,
    fontWeight: '400',
    color: enterpriseColors.gray900,
    letterSpacing: -0.65,
    lineHeight: 34,
  },
  email: {
    fontSize: 15,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 6,
    letterSpacing: -0.15,
  },
  partner: {
    fontSize: 13,
    fontWeight: '500',
    color: enterpriseColors.primary,
    marginTop: 8,
    letterSpacing: -0.05,
  },
  walletWrap: {
    marginBottom: 14,
  },
  logout: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 10,
    minHeight: 48,
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    letterSpacing: -0.15,
  },
});
