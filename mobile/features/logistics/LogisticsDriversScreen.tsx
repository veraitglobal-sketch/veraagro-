import { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, TextInput, TouchableOpacity, Alert } from 'react-native';
import { apiErrorMessage } from '../../lib/api-error';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { User } from 'lucide-react-native';
import { EnterpriseScreen } from '../../components/enterprise/EnterpriseScreen';
import { GrowerStackHeader } from '../../components/grower/GrowerStackHeader';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';
import EmptyState from '../../components/EmptyState';
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

  const [showForm, setShowForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const addDriver = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(t('logistics.drivers.formTitle'), t('logistics.drivers.errName'));
      return;
    }
    setSaving(true);
    try {
      await logisticsDriversAPI.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      setFirstName('');
      setLastName('');
      setPhone('');
      setShowForm(false);
      await load();
    } catch (e) {
      Alert.alert(t('error'), apiErrorMessage(e, t('common.apiErrorGeneric')));
    } finally {
      setSaving(false);
    }
  };

  const input = {
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: enterpriseColors.gray900,
    backgroundColor: enterpriseColors.white,
  } as const;

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
      <View style={{ paddingHorizontal: 16, paddingBottom: 32, gap: 8 }}>
        <TouchableOpacity
          style={[enterpriseUi.authBtnSecondary, { marginBottom: 4 }]}
          onPress={() => setShowForm((v) => !v)}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={enterpriseUi.authBtnSecondaryText}>
            {showForm ? t('common.cancel') : t('logistics.drivers.addCta')}
          </Text>
        </TouchableOpacity>
        {showForm ? (
          <View style={[enterpriseUi.inAppPanel, { padding: 14, gap: 10, marginBottom: 4 }]}>
            <Text style={enterpriseUi.navRowTitle}>{t('logistics.drivers.formTitle')}</Text>
            <TextInput value={firstName} onChangeText={setFirstName} placeholder={t('logistics.drivers.firstName')} placeholderTextColor={enterpriseColors.gray600} style={input} />
            <TextInput value={lastName} onChangeText={setLastName} placeholder={t('logistics.drivers.lastName')} placeholderTextColor={enterpriseColors.gray600} style={input} />
            <TextInput value={phone} onChangeText={setPhone} placeholder={t('logistics.drivers.phone')} placeholderTextColor={enterpriseColors.gray600} keyboardType="phone-pad" style={input} />
            <TouchableOpacity
              style={[enterpriseUi.authBtnPrimary, saving && { opacity: 0.6 }]}
              onPress={() => void addDriver()}
              disabled={saving}
              accessibilityRole="button"
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={enterpriseUi.authBtnPrimaryText}>{t('logistics.vehicles.save')}</Text>}
            </TouchableOpacity>
          </View>
        ) : null}
        {loading ? (
          <ActivityIndicator color={enterpriseColors.primary} style={{ marginTop: 24 }} />
        ) : list.length === 0 ? (
          <EmptyState message={t('logistics.drivers.empty')} icon={User} />
        ) : (
          list.map((d) => (
            <View key={d.id} style={[enterpriseUi.inAppPanel, { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14 }]}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: d.isActive ? '#E8F1E4' : '#ECEEF1', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: d.isActive ? enterpriseColors.primary : '#475467' }}>
                  {[d.firstName, d.lastName].map((n) => (n || '').trim().charAt(0).toUpperCase()).join('') || '?'}
                </Text>
              </View>
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
