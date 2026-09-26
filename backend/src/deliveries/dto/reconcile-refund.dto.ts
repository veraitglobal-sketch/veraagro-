import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsString, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';

class ReconciliationLineDto {
  @IsString() @MinLength(1) @MaxLength(200) sourceKey: string;
  @IsInt() @Min(1) amountCents: number;
  @IsIn(['WALLET_RECOVERY', 'PLATFORM_COST']) method: 'WALLET_RECOVERY' | 'PLATFORM_COST';
}
export class ReconcileRefundDto {
  @IsInt() @Min(0) revision: number;
  @IsIn(['EUR']) currency: string;
  @IsInt() @Min(1) amountCents: number;
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @MinLength(20) @MaxLength(8000) reason: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => ReconciliationLineDto)
  entries: ReconciliationLineDto[];
}
