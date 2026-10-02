import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

/** Grower records what was physically packed for one catalogue order. */
export class RecordPackingDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  packedPackCount: number;

  /** Net weight actually packed; defaults to packs × pack size. Must stay within ±5 % of that. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsPositive()
  packedKg?: number;

  /** Internal batch id or public BATCH-… code for the lot used for this order. */
  @IsOptional()
  @IsString()
  batchId?: string;
}
