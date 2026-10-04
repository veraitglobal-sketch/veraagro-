import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreatePassportReportDto {
  @IsString() @Matches(/\S/) @MaxLength(5000)
  description: string;

  @IsOptional() @IsString() @MaxLength(2_500_000)
  photoDataUrl?: string;

  @IsOptional() @IsEmail() @MaxLength(200)
  contactEmail?: string;

  @IsOptional() @IsString() @MaxLength(40)
  contactPhone?: string;

  @IsOptional() @IsString() @MaxLength(120)
  idempotencyKey?: string;
}
