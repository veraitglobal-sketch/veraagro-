import { IsString, IsInt, Min, IsNumber, IsObject, IsArray, IsOptional, ValidateNested, IsEnum, ArrayMinSize, ArrayMaxSize, MaxLength, IsDefined } from 'class-validator';
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
  qrCode: string; // QR code from warehouse door or from manager
}

export class QualityCheckDto {
  @IsEnum(QualityStatus)
  visualCheck: QualityStatus;

  @IsNumber()
  temperature: number; // Temperature pri istovaru

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  photoUrls: string[]; // 2 fotografije gajbica

  @IsString()
  @IsOptional()
  signature?: string; // Base64 digital signature

  @IsString()
  @IsOptional()
  @MaxLength(8000)
  notes?: string;
}

export class CompleteHandoverDto {
  @IsOptional() @IsInt() @Min(0) revision?: number;
  @IsString()
  handoverId: string;

  @IsDefined()
  @IsObject()
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
