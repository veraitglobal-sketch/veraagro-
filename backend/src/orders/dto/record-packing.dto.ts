import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

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
}
