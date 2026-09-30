import { Transform, Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsPositive, IsString, Matches, MaxLength, Min } from 'class-validator';

export class CreatePackOptionDto {
  @IsString() @Matches(/\S/) @MaxLength(100)
  label: string;

  @Transform(({ obj, key }) => obj[key])
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsPositive()
  packSizeKg: number;

  @Transform(({ obj, key }) => obj[key])
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsPositive()
  pricePerPack: number;

  @IsOptional()
  @Transform(({ obj, key }) => obj[key])
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
