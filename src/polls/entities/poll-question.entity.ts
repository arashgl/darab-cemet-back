import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Poll } from './poll.entity';
import { PollAnswer } from './poll-answer.entity';

export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  RATING = 'rating',
  SCALE = 'scale',
  TEXT = 'text',
  TEXTAREA = 'textarea',
  YES_NO = 'yes_no',
  DROPDOWN = 'dropdown',
  LIKERT = 'likert',
  MATRIX = 'matrix',
}

@Entity('poll_questions')
export class PollQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Poll, (poll) => poll.questions, {
    onDelete: 'CASCADE',
  })
  poll: Poll;

  @Column()
  question: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.SINGLE_CHOICE,
  })
  type: QuestionType;

  @Column({ default: true })
  required: boolean;

  @Column({ default: 0 })
  order: number;

  @Column({ type: 'jsonb', nullable: true })
  options: {
    value: string;
    label: string;
    order?: number;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  validationRules: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    customMessage?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  ratingConfig: {
    min?: number;
    max?: number;
    step?: number;
    labels?: Record<string, string>;
  };

  @Column({ type: 'jsonb', nullable: true })
  matrixConfig: {
    rows?: { value: string; label: string }[];
    columns?: { value: string; label: string }[];
    multipleResponses?: boolean;
  };

  @Column({ default: false })
  allowOther: boolean;

  @Column({ nullable: true })
  placeholder: string;

  @Column({ type: 'jsonb', nullable: true })
  conditionalLogic: {
    showIf?: {
      questionId: number;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;
    }[];
  };

  @OneToMany(() => PollAnswer, (answer) => answer.question)
  answers: PollAnswer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}