import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class DistributorArrivalDto {
  @IsString()
  batchId: string;

  @IsNumber()
  temperatureAtArrival: number; // Celsius

  @IsString()
  visualState: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'DAMAGED';

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  photos?: string[]; // Array of photo URLs
}

export class BorderWaitTimeDto {
  @IsString()
  missionId: string;

  @IsDateString()
  borderArrivalTime: string; // ISO date string

  @IsDateString()
  borderExitTime: string; // ISO date string

  @IsNumber()
  waitTimeMinutes: number;

  @IsString()
  @IsOptional()
  borderName?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
