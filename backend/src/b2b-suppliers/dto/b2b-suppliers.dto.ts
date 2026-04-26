import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsIn, IsEmail, IsBoolean, MinLength } from 'class-validator';
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

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  country: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

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
  address: string;

  @IsString()
  city: string;

  @IsString()
  country: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
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
