import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyEmailCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @Length(4, 4)
  @Matches(/^\d{4}$/, { message: 'Code must be exactly 4 digits' })
  code: string;
}

export class ResendVerificationCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
