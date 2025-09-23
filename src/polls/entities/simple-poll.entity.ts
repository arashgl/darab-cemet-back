import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface PollAnswer {
  questionId: string;
  questionTitle: string;
  importance: string;
  performance: string;
  competitorComparison: string;
  companyStatus: string;
}

@Entity('simple_polls')
export class SimplePoll {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  question: string;

  @Column({ type: 'jsonb' })
  answers: PollAnswer[];

  @Column({ nullable: true })
  respondentName?: string;

  @Column({ nullable: true })
  respondentEmail?: string;

  @Column({ nullable: true })
  respondentPhone?: string;

  @Column({ nullable: true })
  respondentCompany?: string;

  @Column({ nullable: true })
  supplierType?: string;

  @Column({ nullable: true })
  sessionId?: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}