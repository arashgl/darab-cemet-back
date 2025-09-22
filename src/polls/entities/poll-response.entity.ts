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
import { User } from '../../users/entities/user.entity';
import { PollAnswer } from './poll-answer.entity';

export enum ResponseStatus {
  STARTED = 'started',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

export enum SupplierType {
  MANUFACTURER = 'manufacturer',
  OFFICIAL_REP = 'official_representative',
  DISTRIBUTOR = 'distributor',
  TRADING_COMPANY = 'trading_company',
  IMPORTER = 'importer',
}

@Entity('poll_responses')
export class PollResponse {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Poll, (poll) => poll.responses, {
    onDelete: 'CASCADE',
  })
  poll: Poll;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({
    type: 'enum',
    enum: SupplierType,
    nullable: true,
  })
  supplierType: SupplierType;

  @Column({ nullable: true })
  respondentName: string;

  @Column({ nullable: true })
  respondentEmail: string;

  @Column({ nullable: true })
  respondentPhone: string;

  @Column({ nullable: true })
  respondentCompany: string;

  @Column({
    type: 'enum',
    enum: ResponseStatus,
    default: ResponseStatus.STARTED,
  })
  status: ResponseStatus;

  @OneToMany(() => PollAnswer, (answer) => answer.response, {
    cascade: true,
    eager: true,
  })
  answers: PollAnswer[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    browser?: string;
    device?: string;
    location?: string;
    referrer?: string;
    completionTime?: number;
    pageViews?: number;
  };

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 0 })
  progressPercentage: number;

  @Column({ type: 'jsonb', nullable: true })
  scores: {
    total?: number;
    bySection?: Record<string, number>;
    byCategory?: Record<string, number>;
  };
}