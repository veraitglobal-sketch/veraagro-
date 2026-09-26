import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ConfirmBuyerDeliveryDto {
  @IsString()
  @IsNotEmpty()
  deliveryId: string;
}

export class ReportBuyerDeliveryIssueDto extends ConfirmBuyerDeliveryDto {
  @IsString()
  @MinLength(20)
  @MaxLength(8000)
  description: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @MaxLength(2_500_000, { each: true })
  photosBase64: string[];
}
