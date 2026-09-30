import { IsDateString, IsInt, IsOptional, IsString, Matches, Max, Min, MinLength } from 'class-validator';

export class CreateRunDto {
  @IsString()
  @MinLength(1)
  approvedProductId!: string;

  @IsString()
  @MinLength(1)
  producerId!: string;

  @IsString()
  @Matches(/^[A-Z0-9]{3,12}$/, { message: 'lotNumber must be 3-12 uppercase alphanumeric characters' })
  lotNumber!: string;

  @IsInt()
  @Min(2000)
  @Max(new Date().getFullYear() + 1)
  seedCropYear!: number;

  @IsString()
  @MinLength(1)
  originCountry!: string;

  @IsOptional()
  @IsString()
  originRegion?: string;

  @IsString()
  @MinLength(1)
  bagSizeLabel!: string;

  @IsInt()
  @Min(1)
  @Max(20000)
  bagsPlanned!: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
