import { IsOptional, IsString } from 'class-validator';

export class AdminLinkCatalogItemDto {
  @IsOptional()
  @IsString()
  approvedProductId?: string | null;
}
