import { Transform, Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class UpdateCatalogProductDto {
  @IsOptional() @IsString() @Matches(/\S/) @MaxLength(200)
  name?: string;

  @IsOptional() @IsString() @MaxLength(50)
  category?: string;

  @IsOptional() @IsString() @MaxLength(120)
  variety?: string | null;

  @IsOptional() @IsString() @MaxLength(5000)
  description?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  storageConditions?: string | null;

  @IsOptional() @IsString() @MaxLength(2_500_000)
  imageUrl?: string;

  @IsOptional() @IsString() @MaxLength(200)
  estateId?: string | null;

  @IsOptional() @IsString() @MaxLength(200)
  sourcePlantingId?: string | null;

  @IsOptional()
  @Transform(({ obj, key }) => obj[key])
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsPositive()
  plannedQuantityKg?: number;

  @IsOptional() @IsDateString()
  availableFrom?: string | null;

  @IsOptional() @IsDateString()
  availableUntil?: string | null;
}
