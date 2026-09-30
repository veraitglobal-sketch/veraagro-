import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsPositive, IsString, Matches, MaxLength, Min } from 'class-validator';

export class UpdatePackOptionDto {
  @IsOptional() @IsString() @Matches(/\S/) @MaxLength(100)
  label?: string;

  @IsOptional()
  @Transform(({ obj, key }) => obj[key])
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsPositive()
  packSizeKg?: number;

  @IsOptional()
  @Transform(({ obj, key }) => obj[key])
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsPositive()
  pricePerPack?: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ obj, key }) => obj[key])
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
