import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media, MediaType } from './entities/media.entity';
import * as fs from 'fs';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {}

  async findAll(
    page = 1,
    limit = 20,
    type?: MediaType,
  ): Promise<[Media[], number]> {
    const query = this.mediaRepository.createQueryBuilder('media');

    if (type) {
      query.where('media.type = :type', { type });
    }

    return query
      .orderBy('media.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }
    return media;
  }

  async create(file: Express.Multer.File, type: MediaType): Promise<Media> {
    const media = new Media();
    media.filename = file.filename;
    media.originalname = file.originalname;
    media.path = file.path;

    // Fix URL construction to correctly reference the file location
    const basePath = type === MediaType.IMAGE ? 'images' : 'videos';
    media.url = `/uploads/${basePath}/${file.filename}`;

    media.mimetype = file.mimetype;
    media.size = file.size;
    media.type = type;

    return this.mediaRepository.save(media);
  }

  async remove(id: string): Promise<void> {
    const media = await this.findOne(id);

    // Remove file from disk
    try {
      fs.unlinkSync(media.path);
    } catch (error) {
      console.error(`Failed to delete file from disk: ${error.message}`);
    }

    await this.mediaRepository.remove(media);
  }
}
