import { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { User } from 'lucide-react-native';
import { EnterpriseScreen } from '../../components/enterprise/EnterpriseScreen';
import { GrowerStackHeader } from '../../components/grower/GrowerStackHeader';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';
import { logisticsDriversAPI, type LogisticsDriverRow } from '../../lib/api';

export default function LogisticsDriversScreen() {
  const { t } = useTranslation();
  const [list, setList] = useState<LogisticsDriverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await logisticsDriversAPI.list();
      setList(Array.isArray(data) ? data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <EnterpriseScreen
      withTopWash
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
      header={<GrowerStackHeader title={t('logistics.hub.drivers')} subtitle={t('logistics.drivers.lead')} />}
    >
      <View style={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}>
        <Text style={enterpriseUi.navRowSubtitle}>{t('logistics.drivers.webHint')}</Text>
        {loading ? (
          <ActivityIndicator color={enterpriseColors.primary} style={{ marginTop: 24 }} />
        ) : list.length === 0 ? (
          <Text style={enterpriseUi.navRowSubtitle}>{t('logistics.drivers.empty')}</Text>
        ) : (
          list.map((d) => (
            <View key={d.id} style={[enterpriseUi.inAppPanel, { flexDirection: 'row', gap: 12, alignItems: 'center' }]}>
              <User size={22} color={enterpriseColors.primary} strokeWidth={1.5} />
              <View style={{ flex: 1 }}>
                <Text style={enterpriseUi.navRowTitle}>
                  {[d.firstName, d.lastName].filter(Boolean).join(' ')}
                </Text>
                <Text style={enterpriseUi.navRowSubtitle}>
                  {[d.phone, d.email].filter(Boolean).join(' · ') || '—'}
                  {!d.isActive ? ` · ${t('logistics.drivers.inactive')}` : ''}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </EnterpriseScreen>
  );
}
