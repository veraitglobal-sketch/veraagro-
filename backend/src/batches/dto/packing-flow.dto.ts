import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

/**
 * Mobile packing flow: GPS (required) + optional crate/quality photos as base64.
 * When one photo field is set, both must be set and valid (see service validation).
 */
export class PackingFlowBodyDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsString()
  completedAt?: string;

  /** Base64 (optionally with data:image/...;base64, prefix) */
  @IsOptional()
  @IsString()
  cratePhotoBase64?: string;

  @IsOptional()
  @IsString()
  qualityPhotoBase64?: string;
}
