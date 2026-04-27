import {
  IsString,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsArray,
  IsOptional,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WeatherAtHarvestDto {
  @IsNumber()
  @Min(-20)
  @Max(50)
  temperature: number; // Celsius

  @IsNumber()
  @Min(0)
  @Max(100)
  humidity: number; // Percentage

  @IsString()
  cloudCover: 'clear' | 'partly_cloudy' | 'cloudy' | 'overcast';
}

/**
 * Full protocol: pre-cool time, weather, 3 photos, standard confirmation.
 * Simple (mobile) path: `batchId` + `qualityScore` and/or `notes` only.
 */
export class CreateQualityEntryDto {
  @IsString()
  batchId: string;

  @IsOptional()
  @IsDateString()
  preCoolingStartTime?: string;

  @IsOptional()
  weatherAtHarvest?: WeatherAtHarvestDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visualGradePhotos?: string[];

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  standardConfirmation?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  qualityScore?: number;
}

export class LogisticsHandoverDto {
  @IsString()
  missionId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-10)
  @Max(15)
  insideTruckTemperature: number; // Celsius

  /** At least one photo per category required (data URL or public URL) before ready-for-shipment (READY_FOR_LOADING). */
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one pallet photo is required' })
  @ArrayMaxSize(20, { message: 'At most 20 pallet photos' })
  @IsString({ each: true })
  palletPhotos: string[];

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one inside-truck photo is required' })
  @ArrayMaxSize(20, { message: 'At most 20 inside-truck photos' })
  @IsString({ each: true })
  truckInteriorPhotos: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}

/** After loading: receiver name + optional signature image (data URL) for paper trail */
export class HandoverReceiverProofDto {
  @IsString()
  missionId: string;

  @IsString()
  receiverName: string;

  @IsOptional()
  @IsString()
  receiverSignatureDataUrl?: string;
}
