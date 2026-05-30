import { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { Truck } from 'lucide-react-native';
import { EnterpriseScreen } from '../../components/enterprise/EnterpriseScreen';
import { GrowerStackHeader } from '../../components/grower/GrowerStackHeader';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';
import { logisticsVehiclesAPI, type LogisticsVehicleRow } from '../../lib/api';
import EmptyState from '../../components/EmptyState';

export default function LogisticsVehiclesScreen() {
  const { t } = useTranslation();
  const [list, setList] = useState<LogisticsVehicleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [plate, setPlate] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await logisticsVehiclesAPI.list();
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

  const addVehicle = async () => {
    const licensePlate = plate.trim();
    if (!licensePlate) {
      Alert.alert(t('logistics.vehicles.errTitle'), t('logistics.vehicles.errPlate'));
      return;
    }
    setSaving(true);
    try {
      await logisticsVehiclesAPI.create({
        licensePlate,
        type: 'refrigerated_van',
        hasFrigo: true,
        tempRangeMin: 2,
        tempRangeMax: 8,
      });
      setPlate('');
      setShowForm(false);
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert(t('logistics.vehicles.errTitle'), typeof msg === 'string' ? msg : t('common.apiErrorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <EnterpriseScreen
      withTopWash
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
      header={<GrowerStackHeader title={t('logistics.hub.vehicles')} subtitle={t('logistics.vehicles.lead')} />}
    >
      <View style={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}>
        <TouchableOpacity
          style={enterpriseUi.authBtnSecondary}
          onPress={() => setShowForm((v) => !v)}
          activeOpacity={0.8}
        >
          <Text style={enterpriseUi.authBtnSecondaryText}>
            {showForm ? t('common.cancel') : t('logistics.vehicles.addCta')}
          </Text>
        </TouchableOpacity>

        {showForm ? (
          <View style={[enterpriseUi.inAppPanel, { gap: 10 }]}>
            <Text style={enterpriseUi.navRowTitle}>{t('logistics.vehicles.formTitle')}</Text>
            <TextInput
              value={plate}
              onChangeText={setPlate}
              placeholder={t('logistics.vehicles.platePh')}
              autoCapitalize="characters"
              style={{
                borderWidth: 1,
                borderColor: enterpriseColors.gray200,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 16,
              }}
            />
            <TouchableOpacity
              style={[enterpriseUi.authBtnPrimary, saving && { opacity: 0.6 }]}
              onPress={() => void addVehicle()}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={enterpriseUi.authBtnPrimaryText}>{t('logistics.vehicles.save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color={enterpriseColors.primary} style={{ marginTop: 24 }} />
        ) : list.length === 0 ? (
          <EmptyState message={t('logistics.vehicles.empty')} icon={Truck} />
        ) : (
          list.map((v) => (
            <View key={v.id} style={[enterpriseUi.inAppPanel, { flexDirection: 'row', gap: 12, alignItems: 'center' }]}>
              <Truck size={22} color={enterpriseColors.primary} strokeWidth={1.5} />
              <View style={{ flex: 1 }}>
                <Text style={enterpriseUi.navRowTitle}>{v.licensePlate}</Text>
                <Text style={enterpriseUi.navRowSubtitle}>
                  {[v.make, v.model].filter(Boolean).join(' ') || v.type}
                  {' · '}
                  {v.hasFrigo ? t('logistics.vehicles.frigoYes') : t('logistics.vehicles.frigoNo')}
                  {' · '}
                  {v.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </EnterpriseScreen>
  );
}
