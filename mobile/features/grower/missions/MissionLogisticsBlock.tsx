import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Truck, User } from 'lucide-react-native';
import type { Mission } from '../../../lib/api';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import {
  formatDriverName,
  formatVehicleLine,
  missionAssignedDriverFromApi,
  missionShowsDriverBlock,
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
  if (!missionShowsDriverBlock(mission.status)) return null;

  const driver = missionAssignedDriverFromApi(raw);
  const vehicle = missionVehicleFromApi(raw);
  const driverName = formatDriverName(driver);
  const vehicleLine = formatVehicleLine(vehicle);
  const lp = raw.logisticsCompanyContact as { firstName?: string; lastName?: string; phone?: string | null } | null;
  const companyName = lp ? [lp.firstName, lp.lastName].filter(Boolean).join(' ').trim() : '';

  if (!driverName && !vehicleLine && !companyName) {
    return (
      <MissionDetailSection title={t('producer.missions.logisticsTitle')} icon={Truck}>
        <Text style={enterpriseUi.navRowSubtitle}>{t('producer.missions.driverNotAssigned')}</Text>
      </MissionDetailSection>
    );
  }

  return (
    <MissionDetailSection title={t('producer.missions.logisticsTitle')} icon={Truck}>
      {companyName ? <InfoRow label={t('producer.missions.logisticsCompanyLabel')} value={companyName} /> : null}
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
      ) : (
        <Text style={enterpriseUi.navRowSubtitle}>{t('producer.missions.driverNotAssigned')}</Text>
      )}
      {vehicleLine ? (
        <InfoRow label={t('producer.missions.vehicleLabel')} value={vehicleLine} />
      ) : (
        <Text style={[enterpriseUi.navRowSubtitle, { marginTop: 8 }]}>{t('producer.missions.vehicleNotAssigned')}</Text>
      )}
      {vehicle?.licensePlate ? (
        <InfoRow label={t('producer.missions.licensePlateLabel')} value={String(vehicle.licensePlate)} />
      ) : null}
    </MissionDetailSection>
  );
}

const styles = StyleSheet.create({
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
