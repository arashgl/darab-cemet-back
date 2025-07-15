import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
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
  @IsString()
  categoryId?: string;

  leadPicture: string;

  attachments?: string[];
}
