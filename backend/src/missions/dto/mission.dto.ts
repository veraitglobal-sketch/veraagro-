import {
  IsString,
  IsObject,
  IsOptional,
  ValidateNested,
  IsNumber,
  MaxLength,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Pickup point — must declare validators or ValidationPipe (forbidNonWhitelisted) rejects lat/lng/address */
class LocationDto {
  @Type(() => Number)
  @IsNumber()
  lat: number;

  @Type(() => Number)
  @IsNumber()
  lng: number;

  @IsString()
  @IsOptional()
  address?: string;
}

export class CreateMissionDto {
  @IsOptional()
  @IsString()
  batchId?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  pickupLocation: LocationDto;

  @IsString()
  pickupAddress: string;

  /**
   * Drop-off is set by operations (buyer order / admin). Growers may omit; logistics and admin always see full routing when set.
   */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  destinationAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  destinationCity?: string;

  /** Pallets, time window, dock — optional */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  loadInstructions?: string;

  /** Optional explicit harvest plan (berba); a lot's persisted plan takes precedence and must match */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  harvestAnnouncementId?: string;
}

export class AcceptMissionDto {
  @IsOptional()
  @IsString()
  vehicleId?: string;

  /** Delegated pickup person (logistics_drivers row); grower sees profile on portal */
  @IsOptional()
  @IsString()
  logisticsDriverId?: string;
}

/** Admin assigns a logistics partner to a still-unassigned mission (PENDING, no driver). */
export class AdminAssignMissionDto {
  @IsString()
  logisticsPartnerId: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;
}

/** Operations sets / corrects where the load goes (growers never see this). */
export class AdminSetMissionDestinationDto {
  @IsString()
  @MaxLength(200)
  destinationCity: string;

  @IsString()
  @MaxLength(2000)
  destinationAddress: string;
}

/** Operations cancels a run before the truck leaves the farm (e.g. duplicate request). */
export class AdminCancelMissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/** Create a PENDING grower mission from a buyer order (operativa: prep + later pickup for that order). */
export class AdminCreateMissionFromOrderDto {
  @IsString()
  orderId: string;

  /** Free-text: packaging, class, time window, buyer reference, internal codification */
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  opsNotes?: string;

  /** INDUSTRIAL | RETAIL | MIXED — shown in grower + logistics instructions */
  @IsOptional()
  @IsString()
  @IsIn(['INDUSTRIAL', 'RETAIL', 'MIXED'])
  channel?: 'INDUSTRIAL' | 'RETAIL' | 'MIXED';

  /** Target weight (kg) you expect the grower to release for this run */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetKg?: number;
}

/** Logistics-only: advance mission so grower "Mapa puta" and ops status match reality. */
export class LogisticsMissionLifecycleDto {
  @IsIn(['DEPART_FARM', 'START_TRANSIT', 'COMPLETE_DELIVERY'])
  step: 'DEPART_FARM' | 'START_TRANSIT' | 'COMPLETE_DELIVERY';
}
