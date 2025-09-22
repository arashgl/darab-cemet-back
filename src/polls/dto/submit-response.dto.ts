import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  IsEmail,
  IsPhoneNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SupplierType } from '../entities/poll-response.entity';

class SubmitAnswerDto {
  @IsNumber()
  questionId: number;

  @IsOptional()
  value?: any;

  @IsOptional()
  @IsString()
  textValue?: string;

  @IsOptional()
  @IsArray()
  selectedOptions?: string[];

  @IsOptional()
  @IsNumber()
  ratingValue?: number;

  @IsOptional()
  matrixValue?: Record<string, string>;

  @IsOptional()
  @IsString()
  otherValue?: string;
}

export class SubmitResponseDto {
  @IsOptional()
  @IsEnum(SupplierType)
  supplierType?: SupplierType;

  @IsOptional()
  @IsString()
  respondentName?: string;

  @IsOptional()
  @IsEmail()
  respondentEmail?: string;

  @IsOptional()
  @IsPhoneNumber()
  respondentPhone?: string;

  @IsOptional()
  @IsString()
  respondentCompany?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  metadata?: {
    browser?: string;
    device?: string;
    location?: string;
    referrer?: string;
  };
}