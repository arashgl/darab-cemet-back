import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDate,
  IsArray,
  ValidateNested,
  IsNumber,
  IsObject,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PollType, PollStatus } from '../entities/poll.entity';
import { QuestionType } from '../entities/poll-question.entity';

class CreatePollQuestionDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsOptional()
  @IsBoolean()
  required?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsArray()
  options?: {
    value: string;
    label: string;
    order?: number;
  }[];

  @IsOptional()
  @IsObject()
  validationRules?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    customMessage?: string;
  };

  @IsOptional()
  @IsObject()
  ratingConfig?: {
    min?: number;
    max?: number;
    step?: number;
    labels?: Record<string, string>;
  };

  @IsOptional()
  @IsObject()
  matrixConfig?: {
    rows?: { value: string; label: string }[];
    columns?: { value: string; label: string }[];
    multipleResponses?: boolean;
  };

  @IsOptional()
  @IsBoolean()
  allowOther?: boolean;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsObject()
  conditionalLogic?: {
    showIf?: {
      questionId: number;
      operator:
        | 'equals'
        | 'not_equals'
        | 'contains'
        | 'greater_than'
        | 'less_than';
      value: any;
    }[];
  };
}

export class CreatePollDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(PollType)
  type?: PollType = PollType.SURVEY;

  @IsOptional()
  @IsEnum(PollStatus)
  status?: PollStatus = PollStatus.DRAFT;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  requiresAuth?: boolean;

  @IsOptional()
  @IsBoolean()
  allowAnonymous?: boolean = true;

  @IsOptional()
  @IsBoolean()
  allowMultipleSubmissions?: boolean;

  @IsOptional()
  @IsBoolean()
  showResults?: boolean = true;

  @IsOptional()
  @IsBoolean()
  randomizeQuestions?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePollQuestionDto)
  questions?: CreatePollQuestionDto[];
}
