import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class AssignBagsDto {
  @IsOptional()
  @IsString()
  growerId?: string;

  @IsOptional()
  @IsString()
  growerPartnerCode?: string;

  @IsArray()
  @IsString({ each: true })
  serials!: string[];
}
