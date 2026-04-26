import {
  IsString,
  IsObject,
  IsOptional,
  ValidateNested,
  IsNumber,
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
}

export class AcceptMissionDto {
  @IsOptional()
  @IsString()
  vehicleId?: string;
}
