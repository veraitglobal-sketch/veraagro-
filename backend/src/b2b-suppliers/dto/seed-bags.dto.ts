import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class SeedBagSerialsDto {
  @IsArray()
  @IsString({ each: true })
  serials!: string[];
}

export class SellSeedBagsDto extends SeedBagSerialsDto {
  @IsOptional()
  @IsString()
  growerId?: string;

  @IsOptional()
  @IsString()
  growerPartnerCode?: string;

  @IsOptional()
  @IsString()
  directOrderId?: string;
}
