import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CareersApplyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  /** Machine-ish key for filtering inbox (e.g. dev, general, other) */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  roleKey?: string;

  /** Role label as submitted (localized OK) — shown prominently in HR email */
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  appliedRoleTitle: string;

  @IsString()
  @MinLength(35)
  @MaxLength(12000)
  coverLetter: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkedinUrl?: string;

  @IsString()
  resumeBase64: string;

  @IsString()
  @MaxLength(200)
  resumeFileName: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  resumeMimeType?: string;
}
