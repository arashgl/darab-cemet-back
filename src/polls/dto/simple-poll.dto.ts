import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SimplePollAnswerDto {
  @IsString()
  questionId: string;

  @IsString()
  questionTitle: string;

  @IsString()
  importance: string;

  @IsString()
  performance: string;

  @IsString()
  competitorComparison: string;

  @IsString()
  companyStatus: string;
}

export class CreateSimplePollDto {
  @IsString()
  question: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SimplePollAnswerDto)
  answers: SimplePollAnswerDto[];

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

  @IsOptional()
  @IsString()
  supplierType?: string;
}