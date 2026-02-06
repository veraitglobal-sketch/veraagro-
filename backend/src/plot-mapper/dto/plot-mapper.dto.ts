import { IsString, IsNumber, IsObject, IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum CropStatus {
  PREPARING_SOIL = 'PREPARING_SOIL',
  YOUNG_SEEDLING = 'YOUNG_SEEDLING',
  IN_FULL_PRODUCTION = 'IN_FULL_PRODUCTION',
  HARVESTING = 'HARVESTING',
  FALLOW = 'FALLOW',
}

export class ZoneDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsObject()
  coordinates: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };

  @IsNumber()
  area: number; // in m²

  @IsString()
  @IsOptional()
  cropType?: string;

  @IsString()
  @IsOptional()
  plantingDate?: string;

  @IsEnum(CropStatus)
  @IsOptional()
  status?: CropStatus;
}

export class PartitionDto {
  @IsString()
  id: string;

  @IsString()
  type: 'HORIZONTAL' | 'VERTICAL';

  @IsNumber()
  position: number; // Position in pixels or percentage
}

export class BlueprintDataDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ZoneDto)
  zones: ZoneDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartitionDto)
  partitions: PartitionDto[];
}

export class SaveBlueprintDto {
  @IsString()
  parcelId: string;

  @IsNumber()
  length: number; // in meters

  @IsNumber()
  width: number; // in meters

  @ValidateNested()
  @Type(() => BlueprintDataDto)
  blueprintData: BlueprintDataDto;
}
