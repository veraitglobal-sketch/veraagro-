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
import { Type } from 'class-transformer';
import { PASSWORD_REQUIREMENTS } from '../../common/constants';

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
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;
}
