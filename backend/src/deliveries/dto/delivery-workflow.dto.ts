import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class LinkMissionDeliveryDto {
  @IsString() @IsNotEmpty() missionId: string;
  @IsString() @IsNotEmpty() orderId: string;
}

export class ReviewDeliveryDto {
  @IsIn(['START_REVIEW', 'RESOLVE']) action: 'START_REVIEW' | 'RESOLVE';
  @IsInt() @Min(0) revision: number;
  @IsOptional() @IsIn(['ACCEPTED', 'REJECTED', 'REINSPECTION', 'RETURN_REQUIRED']) outcome?: string;
  @IsOptional() @IsString() @MaxLength(8000) resolution?: string;
}
