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
import { Type } from 'class-transformer';

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
}

export class CreateB2bSupplierProfileDto {
  @IsString()
  businessName: string;

  @IsString()
  @IsOptional()
  description?: string;

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
