import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { PostSection } from '../entities/post.entity';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsArray()
  @IsOptional()
  tags: string[];

  @IsNotEmpty()
  @IsEnum(PostSection)
  section: PostSection;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  leadPicture: string;
}
