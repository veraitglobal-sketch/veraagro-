import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateBatchDto {
  @IsString() @IsNotEmpty() estateId: string;
  @IsOptional() @IsString() @IsNotEmpty() parcelId?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100) harvestAnnouncementId?: string;
  @IsString() @IsNotEmpty() @MaxLength(200) productName: string;
  @IsNumber() @IsPositive() quantity: number;
  @IsString() @IsNotEmpty() @MaxLength(30) unit: string;
  @IsDateString() harvestDate: string;
}
