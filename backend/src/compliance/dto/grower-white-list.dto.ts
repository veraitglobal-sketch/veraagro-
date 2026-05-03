import { IsOptional, IsString, MinLength, MaxLength, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

const MATERIAL_TYPES = ['FERTILIZER', 'PESTICIDE', 'SEED', 'OTHER'] as const;

/**
 * Body for POST /compliance/white-list/grower (must be a class — global ValidationPipe validates it).
 */
export class GrowerWhiteListDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3, { message: 'Barcode is too short (minimum 3 characters).' })
  @MaxLength(64, { message: 'Barcode is too long (max 64).' })
  barcode!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1, { message: 'Enter the product / material name.' })
  @MaxLength(500)
  productName!: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return undefined;
    const t = value.trim();
    return t.length ? t : undefined;
  })
  @IsString()
  @MaxLength(500)
  manufacturer?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsIn([...MATERIAL_TYPES], {
    message: 'materialType must be one of: FERTILIZER, PESTICIDE, SEED, OTHER.',
  })
  materialType!: (typeof MATERIAL_TYPES)[number];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return undefined;
    const t = value.trim();
    return t.length ? t : undefined;
  })
  @IsString()
  @MaxLength(4000)
  description?: string;
}
