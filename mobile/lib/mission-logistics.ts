/** Grower mission payload — assigned driver + vehicle from GET /missions. */

export type MissionAssignedDriver = {
  id?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  photoUrl?: string | null;
};

export type MissionVehicleInfo = {
  id?: string;
  vehicleNumber?: string;
  licensePlate?: string;
  make?: string | null;
  model?: string | null;
  type?: string;
};

export function missionAssignedDriverFromApi(mission: Record<string, unknown>): MissionAssignedDriver | null {
  const mapped = mission.assignedDriver as MissionAssignedDriver | null | undefined;
  if (mapped?.firstName || mapped?.lastName) return mapped;
  const raw = mission.assigned_logistics_driver as MissionAssignedDriver | null | undefined;
  if (raw?.firstName || raw?.lastName) return raw;
  const legacy = mission.driver as MissionAssignedDriver | null | undefined;
  if (legacy?.firstName || legacy?.lastName) return legacy;
  return null;
}

export function missionVehicleFromApi(mission: Record<string, unknown>): MissionVehicleInfo | null {
  const mapped = mission.vehicleInfo as MissionVehicleInfo | null | undefined;
  if (mapped?.licensePlate || mapped?.vehicleNumber) return mapped;
  const raw = mission.vehicles as MissionVehicleInfo | null | undefined;
  if (raw?.licensePlate || raw?.vehicleNumber) return raw;
  return null;
}

export function formatDriverName(driver: MissionAssignedDriver | null): string {
  if (!driver) return '';
  return [driver.firstName, driver.lastName].filter(Boolean).join(' ').trim();
}

export function formatVehicleLine(vehicle: MissionVehicleInfo | null): string {
  if (!vehicle) return '';
  const parts = [
    vehicle.licensePlate,
    vehicle.vehicleNumber,
    [vehicle.make, vehicle.model].filter(Boolean).join(' ').trim() || null,
  ].filter((p) => p && String(p).trim());
  return parts.join(' · ');
}

export function missionHasAssignedDriver(mission: Record<string, unknown>): boolean {
  return Boolean(formatDriverName(missionAssignedDriverFromApi(mission)));
}

export function missionShowsDriverBlock(status: string): boolean {
  const s = (status || '').toUpperCase();
  return s !== 'PENDING' && s !== 'CANCELLED';
}

export function missionLogisticsPartnerId(mission: Record<string, unknown>): string | null {
  const id = mission.logisticsPartnerId;
  return id != null && String(id).trim() ? String(id).trim() : null;
}

export function missionLogisticsPartnerLabel(mission: Record<string, unknown>): string {
  const direct = mission.logisticsPartnerLabel;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  const lp = mission.logisticsCompanyContact as
    | { firstName?: string; lastName?: string; partnerCode?: string | null; email?: string | null }
    | null
    | undefined;
  if (lp) {
    const name = [lp.firstName, lp.lastName].filter(Boolean).join(' ').trim();
    if (name) return name;
    if (lp.partnerCode?.trim()) return lp.partnerCode.trim();
    if (lp.email?.trim()) return lp.email.trim();
  }
  const partner = mission.users_missions_logisticsPartnerIdTousers as
    | { firstName?: string; lastName?: string; partnerCode?: string; email?: string }
    | null
    | undefined;
  if (partner) {
    const name = [partner.firstName, partner.lastName].filter(Boolean).join(' ').trim();
    if (name) return name;
    if (partner.partnerCode?.trim()) return partner.partnerCode.trim();
    if (partner.email?.trim()) return partner.email.trim();
  }
  return '';
}

/** Show logistics card when carrier and/or driver/vehicle is relevant (not bare PENDING). */
export function missionShouldShowLogisticsBlock(mission: Record<string, unknown>): boolean {
  const status = String(mission.status ?? '').toUpperCase();
  if (status === 'CANCELLED') return false;
  if (missionLogisticsPartnerId(mission)) return true;
  if (missionHasAssignedDriver(mission)) return true;
  if (missionVehicleFromApi(mission)) return true;
  return missionShowsDriverBlock(status);
}
