import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class PreOrderLineDto {
  @IsString()
  @MaxLength(80)
  productId: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  varietyId?: string;

  @IsString()
  @MaxLength(200)
  label: string;

  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsPositive()
  quantityKg: number;
}

export class CreatePreOrderDto {
  @Type(() => Number)
  @IsInt()
  season: number;

  @IsString()
  @MaxLength(200)
  companyName: string;

  @IsString()
  @MaxLength(200)
  contactPerson: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ValidateNested({ each: true })
  @Type(() => PreOrderLineDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(300)
  lines: PreOrderLineDto[];

  @IsOptional()
  @IsString()
  @MaxLength(40)
  deliveryFrom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  deliveryTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  quality?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  packaging?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}

export const PRE_ORDER_STATUSES = ['NEW', 'REVIEWED', 'CONFIRMED', 'DECLINED'] as const;

export class UpdatePreOrderStatusDto {
  @IsIn(PRE_ORDER_STATUSES as unknown as string[])
  status: (typeof PRE_ORDER_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string;
}
