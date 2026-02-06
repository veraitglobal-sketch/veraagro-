import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateMarketPriceDto {
  @IsString()
  cropType: string;

  @IsNumber()
  @Min(0)
  buyPrice: number;

  @IsNumber()
  @Min(0)
  sellPrice: number;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export class UpdateMarketPriceDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  buyPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sellPrice?: number;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  isActive?: boolean;
}
