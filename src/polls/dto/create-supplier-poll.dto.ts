import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SupplierType } from '../entities/poll-response.entity';

export class SupplierGroupDto {
  @IsString()
  id: string;

  @IsString()
  label: string;
}

export class TableQuestionDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsBoolean()
  required: boolean;
}

export class QuestionColumnDto {
  @IsString()
  id: string;

  @IsString()
  label: string;
}

export class QuestionColumnsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionColumnDto)
  importance: QuestionColumnDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionColumnDto)
  importanceOfTopic: QuestionColumnDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionColumnDto)
  companyPerformance: QuestionColumnDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionColumnDto)
  companyStatus: QuestionColumnDto[];
}

export class CreateSupplierPollDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplierGroupDto)
  supplierGroups: SupplierGroupDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TableQuestionDto)
  tableQuestions: TableQuestionDto[];

  @ValidateNested()
  @Type(() => QuestionColumnsDto)
  questionColumns: QuestionColumnsDto;
}

export class SubmitSupplierResponseDto {
  @IsEnum(SupplierType)
  supplierType: SupplierType;

  @IsOptional()
  @IsString()
  respondentName?: string;

  @IsOptional()
  @IsString()
  respondentEmail?: string;

  @IsOptional()
  @IsString()
  respondentPhone?: string;

  @IsOptional()
  @IsString()
  respondentCompany?: string;

  @IsArray()
  responses: {
    questionId: string;
    importance: string;
    importanceOfTopic: string;
    companyPerformance: string;
    companyStatus: string;
  }[];

  @IsOptional()
  @IsString()
  feedback?: string;
}
