import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, Equals, IsArray, IsDateString, IsIn, IsInt, IsNotEmpty, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateReturnDto {
  @IsIn(['issue', 'dispute']) kind: 'issue' | 'dispute';
  @IsString() @IsNotEmpty() sourceId: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MinLength(10) @MaxLength(2000) destinationAddress: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MinLength(10) @MaxLength(8000) instructions: string;
}
export class ReturnProofDto {
  @IsInt() @Min(0) revision: number;
  @Transform(({ obj, key }) => obj[key]) @Equals(true) fullShipment: boolean;
  @IsArray() @ArrayMinSize(2) @ArrayMaxSize(6) @IsString({ each: true }) @MaxLength(2_500_000, { each: true }) photos: string[];
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MinLength(10) @MaxLength(8000) notes: string;
}
export class ApproveRefundDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MinLength(20) @MaxLength(8000) reason: string;
  @IsInt() @Min(1) amountCents: number;
  @IsIn(['EUR']) currency: string;
}
export class ConfirmRefundDto {
  @IsInt() @Min(0) revision: number;
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MinLength(5) @MaxLength(200) bankReference: string;
  @IsDateString() bankPaidAt: string;
  @IsString() @MaxLength(2_500_000) bankEvidence: string;
  @IsInt() @Min(1) amountCents: number;
  @IsIn(['EUR']) currency: string;
}
