import { Transform, Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class AdjustCatalogStockDto {
  @IsIn(['ADMIN_ADD', 'ADMIN_REMOVE'])
  type: 'ADMIN_ADD' | 'ADMIN_REMOVE';

  @Transform(({ obj, key }) => obj[key])
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsPositive()
  quantityKg: number;

  @IsOptional() @IsString() @MaxLength(500)
  reason?: string;

  @IsOptional() @IsString() @MaxLength(200)
  batchId?: string;
}
