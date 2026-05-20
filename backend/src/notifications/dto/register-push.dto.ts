import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterPushDto {
  @IsString()
  @MinLength(16)
  @MaxLength(4096)
  token: string;

  @IsIn(['ios', 'android', 'IOS', 'ANDROID'])
  platform: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  appSurface?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  locale?: string;
}

export class UnregisterPushDto {
  @IsOptional()
  @IsString()
  @MinLength(16)
  @MaxLength(4096)
  token?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceId?: string;
}
