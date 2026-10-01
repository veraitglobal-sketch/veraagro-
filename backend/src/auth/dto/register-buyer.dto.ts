import {
  IsString,
  IsEmail,
  IsOptional,
  IsObject,
  ValidateNested,
  MinLength,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PASSWORD_REQUIREMENTS } from '../../common/constants';

/** ValidationPipe may receive explicit null from JSON — treat like omitted optional field. */
function optionalTrimmedString({ value }: { value: unknown }): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'string') return value as string;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

class LocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

export class RegisterBuyerDto {
  /** Optional: if omitted, a unique partner code is auto-generated (self-registration) */
  @IsOptional()
  @IsString()
  partnerCode?: string;

  /** Required for self-registration; must be unique */
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @MinLength(PASSWORD_REQUIREMENTS.MIN_LENGTH)
  password: string;

  /** Company / business name (firma) */
  @IsOptional()
  @IsString()
  businessName?: string;

  /** Position in company (pozicija u firmi), e.g. Purchasing Manager, Owner */
  @IsOptional()
  @IsString()
  companyPosition?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  address?: string;

  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  city?: string;

  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  postalCode?: string;

  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  country?: string;

  /** UI language at registration (en, sr, de, es, fr, ro, bg). Defaults to en. */
  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}
