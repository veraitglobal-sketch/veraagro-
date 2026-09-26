import { Transform, Type } from 'class-transformer';
import { IsDefined, IsNumber, IsObject, IsOptional, IsPositive, IsString, IsUUID, Matches, MaxLength, ValidateNested } from 'class-validator';

export class OrderDeliveryAddressDto {
  @IsString() @Matches(/\S/) @MaxLength(300)
  street: string;
  @IsString() @Matches(/\S/) @MaxLength(100)
  city: string;
  // Older reservation clients send street/city/country without a postal code.
  @IsOptional() @IsString() @Matches(/\S/) @MaxLength(30)
  postalCode?: string;
  @IsString() @Matches(/\S/) @MaxLength(100)
  country: string;
}

export class CreateOrderDto {
  @IsOptional() @IsUUID('4')
  clientRequestId?: string;
  @IsOptional() @IsString() @Matches(/\S/) @MaxLength(200)
  productId?: string;
  @IsOptional() @IsString() @MaxLength(200)
  estateId?: string;
  @IsString() @Matches(/\S/) @MaxLength(200)
  productName: string;
  // Preserve JSON types even with the application's implicit conversion enabled.
  @Transform(({ obj, key }) => obj[key]) @IsNumber({ allowInfinity: false, allowNaN: false }) @IsPositive()
  quantity: number;
  @IsString() @Matches(/\S/) @MaxLength(30)
  unit: string;
  @Transform(({ obj, key }) => obj[key]) @IsNumber({ allowInfinity: false, allowNaN: false }) @IsPositive()
  unitPrice: number;
  @IsDefined() @IsObject() @ValidateNested() @Type(() => OrderDeliveryAddressDto)
  deliveryAddress: OrderDeliveryAddressDto;
  @IsOptional() @IsString() @MaxLength(3000)
  deliveryNotes?: string;
}
