import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { PollQuestion } from './poll-question.entity';
import { PollResponse } from './poll-response.entity';
import { User } from '../../users/entities/user.entity';

export enum PollStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
}

export enum PollType {
  SURVEY = 'survey',
  SATISFACTION = 'satisfaction',
  FEEDBACK = 'feedback',
  EVALUATION = 'evaluation',
}

@Entity('polls')
export class Poll {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PollType,
    default: PollType.SURVEY,
  })
  type: PollType;

  @Column({
    type: 'enum',
    enum: PollStatus,
    default: PollStatus.DRAFT,
  })
  status: PollStatus;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ default: false })
  requiresAuth: boolean;

  @Column({ default: true })
  allowAnonymous: boolean;

  @Column({ default: false })
  allowMultipleSubmissions: boolean;

  @Column({ default: true })
  showResults: boolean;

  @Column({ default: false })
  randomizeQuestions: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => User, { nullable: true })
  createdBy: User;

  @OneToMany(() => PollQuestion, (question) => question.poll, {
    cascade: true,
    eager: true,
  })
  questions: PollQuestion[];

  @OneToMany(() => PollResponse, (response) => response.poll)
  responses: PollResponse[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 0 })
  responseCount: number;

  @Column({ default: 0 })
  viewCount: number;
}
