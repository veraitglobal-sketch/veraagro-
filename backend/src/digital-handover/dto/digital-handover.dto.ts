import { IsString, IsNumber, IsBoolean, IsArray, IsOptional, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum HandoverStatus {
  INITIATED = 'INITIATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
}

export enum QualityStatus {
  FRESH = 'FRESH',
  DAMAGED = 'DAMAGED',
}

export class InitiateHandoverDto {
  @IsString()
  deliveryId: string;

  @IsString()
  qrCode: string; // QR kod sa vrata magacina ili od menadžera
}

export class QualityCheckDto {
  @IsEnum(QualityStatus)
  visualCheck: QualityStatus;

  @IsNumber()
  temperature: number; // Temperature pri istovaru

  @IsArray()
  @IsString({ each: true })
  photoUrls: string[]; // 2 fotografije gajbica

  @IsString()
  @IsOptional()
  signature?: string; // Base64 digital signature

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CompleteHandoverDto {
  @IsString()
  handoverId: string;

  @ValidateNested()
  @Type(() => QualityCheckDto)
  qualityCheck: QualityCheckDto;
}

export class DisputeHandoverDto {
  @IsString()
  handoverId: string;

  @IsString()
  reason: string;

  @IsArray()
  @IsString({ each: true })
  evidencePhotos: string[];
}
