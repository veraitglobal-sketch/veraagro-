import { IsString, MinLength } from 'class-validator';

export class RecallRunDto {
  @IsString()
  @MinLength(1)
  reason!: string;
}
