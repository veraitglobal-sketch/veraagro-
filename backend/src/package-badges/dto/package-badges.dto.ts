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

  /** Direct grower user id (preferred when known). */
  @IsOptional()
  @IsUUID()
  newGrowerUserId?: string;

  /** Scan grower QR e.g. FARMER-PARTNER001 */
  @IsOptional()
  @IsString()
  farmerQrCode?: string;

  /** Grower partner code when QR is not available */
  @IsOptional()
  @IsString()
  growerPartnerCode?: string;
}

/** Supplier scans master sticker when stock arrives from the print factory. */
export class ReceiveFromFactoryDto {
  @IsString()
  rootSerial: string;

  /** Optional — speeds lookup when multiple print orders exist */
  @IsOptional()
  @IsString()
  printOrderId?: string;

  /** Override when no print order is on file */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  childSerials?: string[];

  @IsOptional()
  @IsEnum(PackageBadgeType)
  type?: PackageBadgeType;
}

/** Supplier confirms they received a badge tree back from a grower (replaces grower calling return-to-supplier in UI). */
export class ReceiveReturnFromGrowerDto {
  @IsString()
  rootSerial: string;

  @IsUUID()
  fromGrowerUserId: string;
}
