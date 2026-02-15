import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { PASSWORD_REQUIREMENTS } from '../../common/constants';

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
}
