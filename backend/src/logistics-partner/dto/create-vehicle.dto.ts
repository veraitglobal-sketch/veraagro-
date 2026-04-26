import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  MinLength,
  MaxLength,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @Type(() => Number)
  @IsNumber()
  lat: number;

  @Type(() => Number)
  @IsNumber()
  lng: number;
}

export class CreateVehicleDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  licensePlate: string;

  /** e.g. refrigerated_van, rigid_7_5t, articulated */
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  type: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  make?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;

  @IsOptional()
  @IsBoolean()
  hasFrigo?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tempRangeMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tempRangeMax?: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  currentLocation?: LocationDto;
}
