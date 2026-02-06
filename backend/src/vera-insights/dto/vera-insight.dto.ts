import { IsString, IsInt, IsOptional, IsEnum, IsBoolean, Min, Max } from 'class-validator';

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum PriceTrend {
  UP = 'UP',
  DOWN = 'DOWN',
  STABLE = 'STABLE',
}

export class CreateVeraInsightDto {
  @IsString()
  cropName: string;

  @IsInt()
  @Min(1)
  @Max(100)
  veraScore: number;

  @IsOptional()
  @IsInt()
  historicalDeficit?: number;

  @IsString()
  whyText: string;

  @IsEnum(RiskLevel)
  riskLevel: RiskLevel;

  @IsEnum(PriceTrend)
  priceTrend: PriceTrend;

  @IsOptional()
  @IsString()
  seedId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVeraInsightDto {
  @IsOptional()
  @IsString()
  cropName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  veraScore?: number;

  @IsOptional()
  @IsInt()
  historicalDeficit?: number;

  @IsOptional()
  @IsString()
  whyText?: string;

  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @IsOptional()
  @IsEnum(PriceTrend)
  priceTrend?: PriceTrend;

  @IsOptional()
  @IsString()
  seedId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
