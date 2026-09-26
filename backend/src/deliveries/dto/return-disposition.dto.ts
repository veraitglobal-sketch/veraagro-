import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, Equals, IsArray, IsDateString, IsDefined, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';

class StockCountDto {
  @IsString() @MinLength(1) inventoryId: string;
  // Preserve the exact server snapshot, including legacy Float round-off.
  @IsNumber() @Min(0) @Max(1_000_000_000) expectedQuantity: number;
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) @Max(1_000_000_000) countedQuantity: number;
  @IsDateString() expectedUpdatedAt: string;
  @IsDateString() expiresAt: string;
  @Transform(({ obj, key }) => obj[key]) @Equals(true) qualityApproved: boolean;
  @Transform(({ obj, key }) => obj[key]) @Equals(true) stockCountConfirmed: boolean;
  @Transform(({ obj, key }) => obj[key]) @Equals(true) locationConfirmed: boolean;
}
export class ReturnDispositionDto {
  @IsInt() @Min(0) revision: number;
  @IsIn(['QUARANTINE', 'WRITE_OFF', 'RESTOCK']) action: 'QUARANTINE' | 'WRITE_OFF' | 'RESTOCK';
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) @Max(1_000_000_000) quantity: number;
  @IsString() @MinLength(1) @MaxLength(30) unit: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @MinLength(20) @MaxLength(8000) notes: string;
  @IsArray() @ArrayMinSize(2) @ArrayMaxSize(6) @IsString({ each: true }) @MaxLength(2_500_000, { each: true }) photos: string[];
  @IsOptional() @IsDefined() @ValidateNested() @Type(() => StockCountDto) stockCount?: StockCountDto;
}
