import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApprovedProductCategory } from '@prisma/client';

export class CreateApprovedProductDto {
  @IsEnum(ApprovedProductCategory)
  category!: ApprovedProductCategory;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  variety?: string;

  @IsOptional()
  @IsString()
  cropType?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsBoolean()
  isBioVeraBrand?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsString()
  @MinLength(1)
  unit!: string;

  @IsOptional()
  @IsString()
  packSize?: string;

  @IsOptional()
  @IsObject()
  instructions?: Record<string, string>;

  @IsOptional()
  @IsString()
  instructionsPdfUrl?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;
}
