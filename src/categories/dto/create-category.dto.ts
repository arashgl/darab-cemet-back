import { IsString, IsOptional, Matches, IsNumber } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Slug must be in English and can only contain letters, numbers, dashes, and underscores',
  })
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  parentId?: number;
}
