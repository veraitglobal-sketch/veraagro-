import {
  IsString,
  IsObject,
  IsOptional,
  ValidateNested,
  IsNumber,
  MaxLength,
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

  /** Full drop-off address — required for clear routing and load planning */
  @IsString()
  @MaxLength(2000)
  destinationAddress: string;

  /** City / region for grouping multiple partial loads on one truck when they share a destination */
  @IsString()
  @MaxLength(200)
  destinationCity: string;

  /** Pallets, time window, dock — optional */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  loadInstructions?: string;
}

export class AcceptMissionDto {
  @IsOptional()
  @IsString()
  vehicleId?: string;
}

/** Admin assigns a logistics partner to a still-unassigned mission (PENDING, no driver). */
export class AdminAssignMissionDto {
  @IsString()
  logisticsPartnerId: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;
}
