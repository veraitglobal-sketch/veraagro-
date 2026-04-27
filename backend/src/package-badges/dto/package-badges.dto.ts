import { IsArray, IsEnum, IsInt, IsOptional, IsString, ArrayMinSize, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { PackageBadgeType } from '@prisma/client';

export class RegisterPackageBadgesDto {
  @IsString()
  parentSerial: string;

  @IsEnum(PackageBadgeType)
  type: PackageBadgeType;

  @IsArray()
  @ArrayMinSize(0)
  @IsString({ each: true })
  childSerials: string[];

  @IsOptional()
  @IsString()
  ownerUserId?: string;

  @IsOptional()
  @IsString()
  batchId?: string;

  /** If omitted, taken from owner user's farmerQrCode */
  @IsOptional()
  @IsString()
  farmerQrCode?: string;

  /** Ažurira vezu na porudžbinu štampe (mora pripadati tebi) */
  @IsOptional()
  @IsString()
  printOrderId?: string;
}

export class PreviewPrintOrderDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  parentCount: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2000)
  childrenPerParent: number;

  @IsOptional()
  @IsString()
  serialPrefix?: string;
}

export class CreatePrintOrderDto extends PreviewPrintOrderDto {
  @IsOptional()
  @IsUUID()
  printerSupplierId?: string;

  @IsOptional()
  @IsString()
  notesToPrinter?: string;
}

export class ReturnBadgesToSupplierDto {
  @IsString()
  rootSerial: string;

  @IsUUID()
  supplierUserId: string;
}

export class TransferBadgesToGrowerDto {
  @IsString()
  rootSerial: string;

  @IsUUID()
  newGrowerUserId: string;
}
