import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductType } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CategoryService } from 'src/categories/category.service';
export interface ProductFilters {
  type?: ProductType;
  name?: string;
  isActive?: boolean;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private categoryService: CategoryService,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: ProductFilters,
    search?: string,
  ) {
    const query = this.productsRepository.createQueryBuilder('product');

    query.leftJoinAndSelect('product.category', 'category');

    if (filters) {
      if (filters.type) {
        query.andWhere('product.type = :type', { type: filters.type });
      }
      if (filters.name) {
        query.andWhere('product.name LIKE :name', {
          name: `%${filters.name}%`,
        });
      }
    }

    if (search) {
      query.andWhere('product.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('product.createdAt', 'DESC')
      .getManyAndCount();

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto) {
    const body: any = createProductDto;
    if (body.categoryId) {
      body.categoryId = +body.categoryId;
    }
    const product = this.productsRepository.create(body);
    return await this.productsRepository.save(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { categoryId, ...rest } = updateProductDto;
    const product = await this.findOne(id);
    Object.assign(product, rest);
    if (categoryId !== undefined) {
      product.categoryId = categoryId
        ? (await this.categoryService.findOne(+categoryId))?.id
        : undefined;
    }
    return await this.productsRepository.save(product);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    return await this.productsRepository.remove(product);
  }
}
