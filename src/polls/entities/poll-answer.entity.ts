import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { PollQuestion } from './poll-question.entity';
import { PollResponse } from './poll-response.entity';

@Entity('poll_answers')
export class PollAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PollResponse, (response) => response.answers, {
    onDelete: 'CASCADE',
  })
  response: PollResponse;

  @ManyToOne(() => PollQuestion, (question) => question.answers, {
    onDelete: 'CASCADE',
  })
  question: PollQuestion;

  @Column({ type: 'jsonb', nullable: true })
  value: any;

  @Column({ type: 'text', nullable: true })
  textValue: string;

  @Column({ type: 'jsonb', nullable: true })
  selectedOptions: string[];

  @Column({ nullable: true })
  ratingValue: number;

  @Column({ type: 'jsonb', nullable: true })
  matrixValue: Record<string, string>;

  @Column({ nullable: true })
  otherValue: string;

  @CreateDateColumn()
  answeredAt: Date;
}