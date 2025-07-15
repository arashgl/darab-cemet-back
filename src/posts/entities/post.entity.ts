import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../categories/category.entity';
import { User } from '../../users/entities/user.entity';
import { Comment } from './comment.entity';

export enum PostSection {
  OCCASIONS = 'مناسبت ها',
  ANNOUNCEMENTS = 'اطلاعیه ها',
  NEWS = 'اخبار ها',
  ACHIEVEMENTS = 'افتخارات',
  SLIDER = 'اسلایدر',
  HR = 'منابع انسانی',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column('text', { array: true, default: [] })
  tags: string[];

  @Column({
    type: 'enum',
    enum: PostSection,
    default: PostSection.NEWS,
  })
  section: PostSection;

  @Column({ type: 'text' })
  content: string;

  @Column()
  leadPicture: string;

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Comment, (comment) => comment.post, {
    eager: true,
    cascade: true,
  })
  comments: Comment[];

  @Column({ type: 'float', default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  totalRatings: number;

  @Column({ nullable: true, default: 3 })
  readingTime: number;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ nullable: true })
  categoryId?: number;

  @ManyToOne(() => Category, (category) => category.posts)
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
