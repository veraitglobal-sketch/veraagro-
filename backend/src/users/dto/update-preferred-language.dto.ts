import { IsIn, IsString } from 'class-validator';

const SUPPORTED = ['en', 'sr', 'de', 'es', 'fr', 'ro', 'bg'] as const;

export class UpdatePreferredLanguageDto {
  @IsString()
  @IsIn([...SUPPORTED])
  preferredLanguage!: (typeof SUPPORTED)[number];
}
