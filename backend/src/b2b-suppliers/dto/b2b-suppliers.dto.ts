import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsIn,
  IsEmail,
  IsBoolean,
  MinLength,
  IsInt,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/** PATCH bodies often send "" or null; treat as absent so @IsOptional + @MinLength work. */
function emptyToUndefined({ value }: { value: unknown }) {
  if (value === '' || value === null) return undefined;
  return value;
}

/**
 * Admin-only: one step — user account (MATERIAL_SUPPLIER) + store profile.
 * No self-service registration; partners (e.g. agri pharmacies) are onboarded by Bio Vera.
 */
export class AdminCreateSupplierStoreDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  partnerCode?: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsBoolean()
  @IsOptional()
  autoGeneratePassword?: boolean;

  @IsString()
  businessName: string;

  @IsString()
  @IsOptional()
  description?: string;

  /** Ulica (bez broja) */
  @IsString()
  street: string;

  /** Broj (opciono ako je sve u ulici) */
  @IsString()
  @IsOptional()
  houseNumber?: string;

  @IsString()
  postalCode: string;

  @IsString()
  city: string;

  @IsString()
  country: string;

  /** Ako nisu poslati, server računa iz adrese (Nominatim) */
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  /** If true, store appears on public map immediately (same as separate approve) */
  @IsBoolean()
  @IsOptional()
  mapApproved?: boolean;

  /** Partner store selling Vera product line (agri pharmacy network) */
  @IsBoolean()
  @IsOptional()
  isVeraPartner?: boolean;

  @IsString()
  @IsOptional()
  website?: string;
}

export class CreateB2bSupplierProfileDto {
  @IsString()
  businessName: string;

  @IsString()
  @IsOptional()
  description?: string;

  /** Public store website (https), optional */
  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  street: string;

  @IsString()
  @IsOptional()
  houseNumber?: string;

  @IsString()
  postalCode: string;

  @IsString()
  city: string;

  @IsString()
  country: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}

/** Partial update: store + contact; any change to address triggers map re-approval. */
export class UpdateB2bSupplierStoreDto {
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  @MinLength(1)
  businessName?: string;

  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  description?: string;

  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  website?: string;

  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  @MinLength(1)
  street?: string;

  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  houseNumber?: string;

  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  @MinLength(1)
  postalCode?: string;

  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  @MinLength(1)
  city?: string;

  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  @MinLength(1)
  country?: string;

  @Transform(({ value }) =>
    value === '' || value === null || value === undefined ? undefined : Number(value),
  )
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @Transform(({ value }) =>
    value === '' || value === null || value === undefined ? undefined : Number(value),
  )
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @Transform(emptyToUndefined)
  @IsEmail()
  @IsOptional()
  email?: string;

  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  phone?: string;

  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  @MinLength(1)
  firstName?: string;

  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  @MinLength(1)
  lastName?: string;
}

export class CreateThreadDto {
  @IsString()
  supplierUserId: string;
}

export class PostMessageDto {
  @IsString()
  body: string;
}

class OrderItemDto {
  @IsString()
  label: string;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  unit?: string;
}

export class CreateDirectOrderDto {
  @IsString()
  supplierUserId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  threadId?: string;
}

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'REJECTED', 'FULFILLED', 'CANCELLED'] as const;

export class UpdateOrderStatusDto {
  @IsIn(ORDER_STATUSES)
  status: (typeof ORDER_STATUSES)[number];

  @IsString()
  @IsOptional()
  noteFromSupplier?: string;
}

export class CreateCatalogItemDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  listPrice?: number;

  @IsString()
  @IsOptional()
  sku?: string;
}

export class UpdateCatalogItemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  listPrice?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

const SUPPLIER_BARCODE_STATUSES = ['SOLD', 'VOID'] as const;

export class RegisterSupplierMaterialBarcodeDto {
  @IsString()
  @MinLength(3)
  barcode: string;

  @IsString()
  @IsOptional()
  catalogItemId?: string;

  @IsString()
  @IsOptional()
  lotNumber?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateSupplierMaterialBarcodeDto {
  @IsIn(SUPPLIER_BARCODE_STATUSES)
  status: (typeof SUPPLIER_BARCODE_STATUSES)[number];

  /** Grower account when the sale is attributed to a known farmer (optional for over-the-counter) */
  @IsString()
  @IsOptional()
  soldToFarmerId?: string;

  /** Optional link to a direct order (must be same supplier + same farmer as soldToFarmerId) */
  @IsString()
  @IsOptional()
  directOrderId?: string;
}
