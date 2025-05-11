import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  findAll() {
    return this.categoryRepo.find();
  }

  findOne(id: number) {
    return this.categoryRepo.findOneByOrFail({ id });
  }

  findBySlug(slug: string) {
    console.log(slug, '<<');
    return this.categoryRepo.findOneByOrFail({ slug });
  }

  async create(data: Partial<Category>) {
    const category = this.categoryRepo.create(data);
    return this.categoryRepo.save(category);
  }

  async update(id: number, data: Partial<Category>) {
    await this.categoryRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    return this.categoryRepo.remove(category);
  }
}
