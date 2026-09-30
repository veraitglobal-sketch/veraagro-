import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class PreviewAssignDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  serials!: string[];
}
