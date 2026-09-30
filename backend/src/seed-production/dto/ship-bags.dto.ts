import { IsArray, IsString, MinLength } from 'class-validator';

export class ShipBagsDto {
  @IsString()
  @MinLength(1)
  supplierUserId!: string;

  @IsArray()
  @IsString({ each: true })
  serials!: string[];
}
