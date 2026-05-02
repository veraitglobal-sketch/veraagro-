import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  Min,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Body for POST /harvest-announcements (grower app + web).
 * Class required so global ValidationPipe (whitelist / transform) applies correctly.
 */
export class CreateHarvestAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  parcelId: string;

  @IsIn(['HARVEST', 'PLANTING'])
  announcementType: 'HARVEST' | 'PLANTING';

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  cropType: string;

  @IsString()
  @IsNotEmpty()
  estimatedDate: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedQuantity?: number;

  @IsOptional()
  @IsString()
  plannedLoadingStart?: string;

  @IsOptional()
  @IsString()
  plannedLoadingEnd?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  loadQuantityKg?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  marketChannel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  qualityGrade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  sortingSpec?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  notes?: string;
}
