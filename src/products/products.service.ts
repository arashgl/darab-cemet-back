import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductType } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: ProductFilters,
    search?: string,
  ) {
    const query = this.productsRepository.createQueryBuilder('product');

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
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto) {
    const product = this.productsRepository.create(createProductDto);
    return await this.productsRepository.save(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);
    const updatedProduct = this.productsRepository.merge(
      product,
      updateProductDto,
    );
    return await this.productsRepository.save(updatedProduct);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    return await this.productsRepository.remove(product);
  }
}
