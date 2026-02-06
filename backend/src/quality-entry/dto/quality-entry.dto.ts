import { IsString, IsNumber, IsDateString, IsBoolean, IsArray, IsOptional, Min, Max } from 'class-validator';

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

export class CreateQualityEntryDto {
  @IsString()
  batchId: string;

  @IsDateString()
  preCoolingStartTime: string; // ISO date string

  weatherAtHarvest: WeatherAtHarvestDto;

  @IsArray()
  @IsString({ each: true })
  visualGradePhotos: string[]; // Array of photo URLs or base64

  @IsBoolean()
  standardConfirmation: boolean; // Must be true

  @IsOptional()
  @IsString()
  notes?: string;
}

export class LogisticsHandoverDto {
  @IsString()
  missionId: string;

  @IsNumber()
  @Min(-10)
  @Max(15)
  insideTruckTemperature: number; // Celsius

  @IsString()
  @IsOptional()
  notes?: string;
}
