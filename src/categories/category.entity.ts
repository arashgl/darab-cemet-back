import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { Product } from '../products/entities/product.entity';
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Post, (post) => post.category)
  posts: Post[];

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
