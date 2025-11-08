import { IsString, Matches, IsOptional } from 'class-validator';

export class CreateLandingSettingDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Key must contain only English letters, numbers, underscores, and hyphens',
  })
  key: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  image?: string;
}
