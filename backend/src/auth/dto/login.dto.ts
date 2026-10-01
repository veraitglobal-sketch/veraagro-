import { IsIn, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string; // Can be email or partnerCode

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  @IsIn(['en', 'sr', 'de', 'es', 'fr', 'ro', 'bg'])
  preferredLanguage?: string;
}
