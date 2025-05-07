import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProductType {
  CEMENT = 'cement',
  CONCRETE = 'concrete',
  OTHER = 'other',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ProductType,
    default: ProductType.CEMENT,
  })
  type: ProductType;

  @Column({ nullable: true })
  image: string;

  @Column({ type: 'simple-array', nullable: true })
  features: string[];

  @Column({ type: 'simple-array', nullable: true })
  advantages: string[];

  @Column({ type: 'simple-array', nullable: true })
  applications: string[];

  @Column({ type: 'simple-array', nullable: true })
  technicalSpecs: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
