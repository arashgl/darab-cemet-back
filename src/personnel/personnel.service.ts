import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { CreatePersonnelDto, UpdatePersonnelDto } from './dto';
import { Personnel, PersonnelType } from './entities/personnel.entity';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface PersonnelFilters {
  type?: PersonnelType;
  name?: string;
  position?: string;
}

@Injectable()
export class PersonnelService {
  constructor(
    @InjectRepository(Personnel)
    private personnelRepository: Repository<Personnel>,
  ) {}

  async create(createPersonnelDto: CreatePersonnelDto): Promise<Personnel> {
    const personnel = this.personnelRepository.create(createPersonnelDto);
    return await this.personnelRepository.save(personnel);
  }

  async findAll(
    page = 1,
    limit = 10,
    filters?: PersonnelFilters,
    search?: string,
  ): Promise<PaginatedResponse<Personnel>> {
    const skip = (page - 1) * limit;

    // Build query with filters
    const queryBuilder = this.personnelRepository
      .createQueryBuilder('personnel')
      .skip(skip)
      .take(limit)
      .orderBy('personnel.createdAt', 'DESC');

    // Apply filters if provided
    if (filters) {
      if (filters.type) {
        queryBuilder.andWhere('personnel.type = :type', {
          type: filters.type,
        });
      }

      if (filters.name) {
        queryBuilder.andWhere('personnel.name LIKE :name', {
          name: `%${filters.name}%`,
        });
      }

      if (filters.position) {
        queryBuilder.andWhere('personnel.position LIKE :position', {
          position: `%${filters.position}%`,
        });
      }
    }

    // Apply global search if provided
    if (search) {
      queryBuilder.andWhere(
        '(personnel.name LIKE :search OR personnel.position LIKE :search OR personnel.education LIKE :search OR personnel.workplace LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Execute query and count
    const [personnel, totalItems] = await queryBuilder.getManyAndCount();

    return {
      data: personnel,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async findByType(type: PersonnelType): Promise<Personnel[]> {
    return await this.personnelRepository.find({
      where: { type },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Personnel> {
    const personnel = await this.personnelRepository.findOne({
      where: { id },
    });

    if (!personnel) {
      throw new NotFoundException(`Personnel with ID ${id} not found`);
    }

    return personnel;
  }

  async update(
    id: string,
    updatePersonnelDto: UpdatePersonnelDto,
  ): Promise<Personnel> {
    const personnel = await this.findOne(id);

    // If updating with a new image and old image exists, delete the old one
    if (
      updatePersonnelDto.image &&
      personnel.image &&
      personnel.image !== updatePersonnelDto.image
    ) {
      this.deleteImageFile(personnel.image);
    }

    Object.assign(personnel, updatePersonnelDto);

    return await this.personnelRepository.save(personnel);
  }

  async remove(id: string): Promise<void> {
    const personnel = await this.findOne(id);

    // Delete the image file if it exists
    if (personnel.image) {
      this.deleteImageFile(personnel.image);
    }

    await this.personnelRepository.remove(personnel);
  }

  private deleteImageFile(imagePath: string): void {
    try {
      // Remove leading slash and construct full path
      const fileName = imagePath.replace('/uploads/', '');
      const fullPath = join(process.cwd(), 'uploads', fileName);

      if (existsSync(fullPath)) {
        unlinkSync(fullPath);
      }
    } catch (error) {
      console.error('Error deleting image file:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }
}
