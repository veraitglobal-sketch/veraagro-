import { IsString, IsNumber, IsArray, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class PurchaseMaterialDto {
  @IsString()
  materialTypeId: string;

  @IsNumber()
  @Min(1)
  @Max(200)
  quantity: number;
}

export class VerifyStickerRollDto {
  @IsString()
  stickerRollId: string;

  @IsString()
  batchId: string;

  /** If sent, must match `batches.parcelId`. */
  @IsOptional()
  @IsString()
  parcelId?: string;
}

export class UploadCompliancePhotosDto {
  @IsString()
  batchId: string;

  /** If sent, must match `batches.parcelId`. */
  @IsOptional()
  @IsString()
  parcelId?: string;

  @IsArray()
  @IsString({ each: true })
  photos: string[]; // Array of base64 or URLs

  @IsString()
  stickerRollId: string; // Must match verified sticker roll
}

export class UpdateBioVeraStandardDto {
  @IsString()
  @IsOptional()
  requiredTemperatureMin?: number;

  @IsString()
  @IsOptional()
  requiredTemperatureMax?: number;

  @IsString()
  @IsOptional()
  requiredPackagingType?: string;

  @IsString()
  @IsOptional()
  requiredFilmType?: string;

  @IsBoolean()
  @IsOptional()
  requiresCompliancePhotos?: boolean;

  @IsNumber()
  @IsOptional()
  qualityPremiumAmount?: number;
}
