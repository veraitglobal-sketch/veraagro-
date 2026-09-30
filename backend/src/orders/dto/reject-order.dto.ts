import { IsString, Matches, MaxLength } from 'class-validator';

export class RejectOrderDto {
  @IsString() @Matches(/\S/) @MaxLength(500)
  reason: string;
}
