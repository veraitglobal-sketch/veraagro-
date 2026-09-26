import { IsString, MaxLength, MinLength } from 'class-validator';
export class ReserveStockDto {
  @IsString() @MinLength(1) @MaxLength(200) inventoryId: string;
}
