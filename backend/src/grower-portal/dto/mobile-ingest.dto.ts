import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/** Product line synced from the grower mobile offline queue */
export class IngestMobileProductDto {
  @IsString()
  @IsNotEmpty()
  clientReference: string;

  @IsIn(['qr', 'manual'])
  source: 'qr' | 'manual';

  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsString()
  name: string;

  @IsString()
  contents: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsString()
  parcelOrEstate?: string;

  @IsString()
  timestamp: string;
}

export class IngestMobileCostDto {
  @IsString()
  @IsNotEmpty()
  clientReference: string;

  @IsIn(['product', 'manual'])
  type: 'product' | 'manual';

  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  label: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  estateId?: string;

  @IsOptional()
  @IsString()
  parcelId?: string;

  @IsOptional()
  @IsString()
  harvestAnnouncementId?: string;

  @IsOptional()
  @IsString()
  parcelLabel?: string;

  @IsOptional()
  @IsString()
  plantingLabel?: string;

  @IsString()
  timestamp: string;
}

export class IngestMobileCertificatePhotoDto {
  @IsString()
  @IsNotEmpty()
  clientReference: string;

  @IsString()
  certificateId: string;

  @IsString()
  certificateTitle: string;

  /** May be a device-local file URI; stored as metadata only until a proper upload is implemented */
  @IsString()
  photoUri: string;

  @IsString()
  timestamp: string;
}
