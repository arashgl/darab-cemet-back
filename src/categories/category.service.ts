import { ConflictException, Injectable } from '@nestjs/common';
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

  async create(data: Partial<Category> & { parentId?: number }) {
    const category = this.categoryRepo.create(data);
    if (data.parentId) {
      const parent = await this.categoryRepo.findOneBy({ id: data.parentId });
      category.parent = parent || undefined;
    }
    const isSlugExists = await this.categoryRepo.findOneBy({ slug: data.slug });
    if (isSlugExists) {
      throw new ConflictException('Slug already exists');
    }
    const isNameExists = await this.categoryRepo.findOneBy({ name: data.name });
    if (isNameExists) {
      throw new ConflictException('Name already exists');
    }
    return this.categoryRepo.save(category);
  }

  async update(id: number, data: Partial<Category> & { parentId?: number }) {
    const category = await this.findOne(id);
    if (data.parentId !== undefined) {
      if (data.parentId) {
        const parent = await this.categoryRepo.findOneBy({ id: data.parentId });
        category.parent = parent || undefined;
      } else {
        category.parent = undefined;
      }
    }
    if (data.name !== undefined) category.name = data.name;
    if (data.slug !== undefined) category.slug = data.slug;
    if (data.description !== undefined) category.description = data.description;
    return this.categoryRepo.save(category);
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    return this.categoryRepo.remove(category);
  }

  async getChildren(id: number) {
    return this.categoryRepo.find({ where: { parent: { id } } });
  }
}
