import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class PushTestDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
