import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import { Repository } from 'typeorm';
import { Media, MediaType } from './entities/media.entity';
import { MediaItem, MediaResponse } from './interfaces/media.interface';

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
  ): Promise<MediaResponse> {
    const query = this.mediaRepository.createQueryBuilder('media');

    if (type) {
      query.where('media.type = :type', { type });
    }

    const [items, totalItems] = await query
      .orderBy('media.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data: MediaItem[] = items.map((media) => ({
      id: media.id,
      type: this.mapMediaTypeToItemType(media.type),
      title: media.title,
      description: media.description,
      coverImage: media.coverImage || '',
      url: media.url,
      createdAt: media.createdAt.toISOString(),
      tags: media.tags,
    }));

    return {
      data,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  private mapMediaTypeToItemType(
    mediaType: MediaType,
  ): 'gallery' | 'iframe' | 'url' {
    switch (mediaType) {
      case MediaType.GALLERY:
        return 'gallery';
      case MediaType.IFRAME:
        return 'iframe';
      case MediaType.URL:
        return 'url';
      default:
        return 'gallery'; // Default for IMAGE and VIDEO types
    }
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }
    return media;
  }

  async create(
    file: Express.Multer.File,
    type: MediaType,
    title?: string,
    description?: string,
    tags?: string[],
  ): Promise<Media> {
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
    media.title = title || file.originalname;
    media.description = description;
    media.coverImage = media.url; // Use the same URL as cover image for uploaded files
    media.tags = tags;

    return this.mediaRepository.save(media);
  }

  async createExternalMedia(
    type: MediaType.URL | MediaType.IFRAME | MediaType.GALLERY,
    title: string,
    url: string,
    coverImage?: string,
    description?: string,
    tags?: string[],
  ): Promise<Media> {
    const media = new Media();
    media.filename = '';
    media.originalname = '';
    media.path = '';
    media.url = url;
    media.mimetype = '';
    media.size = 0;
    media.type = type;
    media.title = title;
    media.description = description;
    if (coverImage) media.coverImage = coverImage;
    media.tags = tags;

    return this.mediaRepository.save(media);
  }

  async createGalleryMedia(
    title: string,
    description?: string,
    tags?: string[],
    files?: Express.Multer.File[],
  ): Promise<Media> {
    if (!files || files.length === 0) {
      throw new Error('Gallery media requires at least one file');
    }

    // Use the first file as the main media entry
    const primaryFile = files[0];
    const media = new Media();
    media.filename = primaryFile.filename;
    media.originalname = primaryFile.originalname;
    media.path = primaryFile.path;
    media.url = `/uploads/gallery/${primaryFile.filename}`;
    media.mimetype = primaryFile.mimetype;
    media.size = primaryFile.size;
    media.type = MediaType.GALLERY;
    media.title = title;
    media.description = description;
    media.coverImage = media.url; // Use the first image as cover
    media.tags = tags;

    // For now, we'll save the primary file. In a more complex implementation,
    // you might want to save all files and create a relationship between them
    // or store multiple file paths in a JSON field
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
