import { IsArray, IsDateString, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ConfirmProductionDto {
  @IsInt()
  @Min(1)
  bagsProduced!: number;

  @IsDateString()
  productionDate!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  germinationPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  purityPct?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certificateUrls?: string[];
}
