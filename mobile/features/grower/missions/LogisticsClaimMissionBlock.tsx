import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { missionsAPI, type Mission } from '../../../lib/api';
import { canClaimLogisticsMission } from '../../../lib/logistics-mission-helpers';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';

interface Props {
  mission: Mission;
  onClaimed: () => void;
}

function apiErrorMessage(e: unknown, fallback: string): string {
  const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (typeof msg === 'string') return msg;
  if (Array.isArray(msg)) return msg.join(' ');
  return fallback;
}

export default function LogisticsClaimMissionBlock({ mission, onClaimed }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  if (!canClaimLogisticsMission(mission)) {
    return null;
  }

  const claim = async () => {
    setBusy(true);
    try {
      await missionsAPI.claimMission(mission.id);
      onClaimed();
    } catch (e: unknown) {
      const text = apiErrorMessage(e, t('logistics.claim.errFallback'));
      Alert.alert(t('logistics.claim.errTitle'), text);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[enterpriseUi.inAppPanel, { gap: 8 }]}>
      <Text style={enterpriseUi.navRowTitle}>{t('logistics.claim.title')}</Text>
      <Text style={enterpriseUi.navRowSubtitle}>{t('logistics.claim.body')}</Text>
      <TouchableOpacity
        style={[enterpriseUi.authBtnPrimary, busy && { opacity: 0.65 }]}
        onPress={() => void claim()}
        disabled={busy}
        accessibilityRole="button"
      >
        {busy ? (
          <ActivityIndicator color={enterpriseColors.white} />
        ) : (
          <Text style={enterpriseUi.authBtnPrimaryText}>{t('logistics.claim.cta')}</Text>
        )}
      </TouchableOpacity>
      <Text style={[enterpriseUi.navRowSubtitle, { fontSize: 14 }]}>{t('logistics.claim.vehicleHint')}</Text>
    </View>
  );
}
