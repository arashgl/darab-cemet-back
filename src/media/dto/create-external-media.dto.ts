import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';

export class CreateExternalMediaDto {
  @IsEnum(['url', 'iframe', 'gallery'])
  type: 'url' | 'iframe' | 'gallery';

  @IsString()
  title: string;

  @ValidateIf((o) => o.type !== 'gallery')
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
