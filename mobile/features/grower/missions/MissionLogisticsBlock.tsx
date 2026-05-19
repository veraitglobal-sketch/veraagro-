import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Truck, User, Building2 } from 'lucide-react-native';
import type { Mission } from '../../../lib/api';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import {
  formatDriverName,
  formatVehicleLine,
  missionAssignedDriverFromApi,
  missionLogisticsPartnerLabel,
  missionShouldShowLogisticsBlock,
  missionVehicleFromApi,
} from '../../../lib/mission-logistics';
import { MissionDetailSection } from './MissionDetailSection';

interface MissionLogisticsBlockProps {
  mission: Mission;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <View style={styles.row}>
      <Text style={enterpriseUi.navRowSubtitle}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function MissionLogisticsBlock({ mission }: MissionLogisticsBlockProps) {
  const { t } = useTranslation();
  const raw = mission as unknown as Record<string, unknown>;
  if (!missionShouldShowLogisticsBlock(raw)) return null;

  const driver = missionAssignedDriverFromApi(raw);
  const vehicle = missionVehicleFromApi(raw);
  const driverName = formatDriverName(driver);
  const vehicleLine = formatVehicleLine(vehicle);
  const partnerLabel = missionLogisticsPartnerLabel(raw);
  const hasPartner = Boolean(partnerLabel);
  const status = String(mission.status ?? '').toUpperCase();

  return (
    <MissionDetailSection title={t('producer.missions.logisticsTitle')} icon={Truck}>
      {status === 'ASSIGNED' && !driverName ? (
        <Text style={styles.hintBanner}>{t('producer.missions.assignedToCarrierHint')}</Text>
      ) : null}

      {hasPartner ? (
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <Building2 size={16} color={enterpriseColors.gray600} strokeWidth={1.5} />
            <Text style={enterpriseUi.navRowSubtitle}>{t('producer.missions.logisticsCompanyLabel')}</Text>
          </View>
          <Text style={styles.value}>{partnerLabel}</Text>
        </View>
      ) : (
        <Text style={enterpriseUi.navRowSubtitle}>{t('producer.missions.carrierNotAssigned')}</Text>
      )}

      {driverName ? (
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <User size={16} color={enterpriseColors.gray600} strokeWidth={1.5} />
            <Text style={enterpriseUi.navRowSubtitle}>{t('producer.missions.driverLabel')}</Text>
          </View>
          <Text style={styles.value}>{driverName}</Text>
          {driver?.phone ? (
            <TouchableOpacity onPress={() => void Linking.openURL(`tel:${driver.phone}`)} hitSlop={{ top: 8, bottom: 8 }}>
              <Text style={styles.link}>{driver.phone}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : hasPartner ? (
        <Text style={[styles.pendingDriver, { marginTop: 4 }]}>{t('producer.missions.driverNotAssigned')}</Text>
      ) : null}

      {vehicleLine ? (
        <InfoRow label={t('producer.missions.vehicleLabel')} value={vehicleLine} />
      ) : hasPartner || driverName ? (
        <Text style={[enterpriseUi.navRowSubtitle, { marginTop: 8 }]}>{t('producer.missions.vehicleNotAssigned')}</Text>
      ) : null}
      {vehicle?.licensePlate ? (
        <InfoRow label={t('producer.missions.licensePlateLabel')} value={String(vehicle.licensePlate)} />
      ) : null}
    </MissionDetailSection>
  );
}

const styles = StyleSheet.create({
  hintBanner: {
    fontSize: 15,
    lineHeight: 22,
    color: enterpriseColors.gray700,
    backgroundColor: enterpriseColors.primaryTint,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  pendingDriver: {
    fontSize: 15,
    lineHeight: 21,
    color: enterpriseColors.gray600,
    marginBottom: 8,
  },
  row: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.2,
  },
  link: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.primary,
    marginTop: 4,
  },
});
