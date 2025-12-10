import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PostSection } from '../entities/post.entity';
import { AttachmentDto } from './attachment.dto';

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  gallery?: string[];
}
