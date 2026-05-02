import { Allow } from 'class-validator';

/** Set or clear the delegated pickup driver on an assigned mission (logistics partner only). */
export class UpdateMissionLogisticsDriverDto {
  /** UUID to assign, or null / empty string to clear */
  @Allow()
  logisticsDriverId?: string | null;
}
