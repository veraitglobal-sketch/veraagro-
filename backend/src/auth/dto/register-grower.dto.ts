import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PASSWORD_REQUIREMENTS } from '../../common/constants';

class GrowerLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

export class RegisterGrowerDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(PASSWORD_REQUIREMENTS.MIN_LENGTH)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(100000)
  totalHectares?: number;

  @IsOptional()
  @IsString()
  farmName?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GrowerLocationDto)
  location?: GrowerLocationDto;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;
}
