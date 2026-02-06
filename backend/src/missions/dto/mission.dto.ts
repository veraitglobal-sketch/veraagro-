import { IsString, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  lat: number;
  lng: number;
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
