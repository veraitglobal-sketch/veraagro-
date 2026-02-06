import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsObject } from 'class-validator';

export class CreateAuditTrailDto {
  @IsString()
  eventType: string;

  @IsString()
  entityType: string;

  @IsString()
  entityId: string;

  @IsOptional()
  @IsString()
  performedByUserId?: string;

  @IsOptional()
  @IsObject()
  oldValue?: any;

  @IsObject()
  newValue: any;

  @IsOptional()
  @IsString()
  changeReason?: string;

  @IsOptional()
  @IsObject()
  location?: any;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsString()
  temperatureUnit?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  deviceModel?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsBoolean()
  isCompliant?: boolean;

  @IsOptional()
  @IsDateString()
  timestamp?: string;
}
