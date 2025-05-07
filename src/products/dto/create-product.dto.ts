import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ProductType } from '../entities/product.entity';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsEnum(ProductType)
  type: ProductType;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  advantages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technicalSpecs?: string[];
}
