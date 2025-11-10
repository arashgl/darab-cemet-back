import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PersonnelType {
  MANAGER = 'manager',
  ASSISTANT = 'assistant',
  MANAGERS = 'managers',
}

@Entity('personnel')
export class Personnel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  position: string;

  @Column()
  education: string;

  @Column()
  workplace: string;

  @Column('text')
  experience: string;

  @Column()
  phone: string;

  @Column()
  email: string;

  @Column('text')
  resume: string;

  @Column({ type: 'text', nullable: true })
  additionalInfo?: string;

  @Column({ nullable: true })
  image?: string;

  @Column({
    type: 'enum',
    enum: PersonnelType,
    default: PersonnelType.ASSISTANT,
  })
  type: PersonnelType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
