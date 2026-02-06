import { IsString, IsNumber, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  lat: number;
  lng: number;
  address?: string;
}

export class CreateTemperatureLogDto {
  @IsOptional()
  @IsString()
  missionId?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  batchId?: string;

  @IsNumber()
  temperature: number;

  @IsOptional()
  @IsNumber()
  humidity?: number;

  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsOptional()
  @IsString()
  sensorId?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
