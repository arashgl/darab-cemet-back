import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateExternalMediaDto } from './dto/create-external-media.dto';
import { Media, MediaType } from './entities/media.entity';
import { MediaResponse } from './interfaces/media.interface';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('type') type?: MediaType,
  ): Promise<MediaResponse> {
    console.log('Fetching media with params:', { page, limit, type });
    return this.mediaService.findAll(+page, +limit, type);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          let folderName: string;

          if (file.mimetype.startsWith('image/')) {
            folderName = 'images';
          } else if (file.mimetype.startsWith('video/')) {
            folderName = 'videos';
          } else {
            return cb(
              new BadRequestException('Unsupported file type') as any,
              '',
            );
          }

          const uploadPath = join(process.cwd(), 'uploads', folderName);

          // Ensure directory exists
          try {
            if (!existsSync(uploadPath)) {
              mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
          } catch (error) {
            cb(
              new BadRequestException(
                `Failed to create upload directory: ${error.message}`,
              ) as any,
              '',
            );
          }
        },
        filename: (req, file, cb) => {
          try {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            const filename = `${uniqueSuffix}${ext}`;
            cb(null, filename);
          } catch (error) {
            cb(
              new BadRequestException(
                `Failed to generate filename: ${error.message}`,
              ) as any,
              '',
            );
          }
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/webm',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Only image (JPEG, PNG, GIF, WebP) and video (MP4, WebM) files are allowed',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<Media> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const type = file.mimetype.startsWith('image/')
      ? MediaType.IMAGE
      : MediaType.VIDEO;

    return this.mediaService.create(file, type);
  }

  @Post('external')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'galleryFiles', maxCount: 10 }], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'gallery');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/webm',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Only image (JPEG, PNG, GIF, WebP) and video (MP4, WebM) files are allowed',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async createExternalMedia(
    @Body() createExternalMediaDto: CreateExternalMediaDto,
    @UploadedFiles() files: { galleryFiles?: Express.Multer.File[] },
  ): Promise<Media> {
    if (createExternalMediaDto.type === 'gallery') {
      // For gallery type, we expect file uploads
      if (!files?.galleryFiles || files.galleryFiles.length === 0) {
        throw new BadRequestException(
          'Gallery type requires at least one file upload',
        );
      }

      return this.mediaService.createGalleryMedia(
        createExternalMediaDto.title,
        createExternalMediaDto.description,
        createExternalMediaDto.tags,
        files.galleryFiles,
      );
    }

    // For URL and iframe types, handle as before
    if (!createExternalMediaDto.url) {
      throw new BadRequestException(
        'URL and coverImage are required for non-gallery types',
      );
    }

    const mediaType =
      createExternalMediaDto.type === 'url' ? MediaType.URL : MediaType.IFRAME;

    return this.mediaService.createExternalMedia(
      mediaType,
      createExternalMediaDto.title,
      createExternalMediaDto.url,
      createExternalMediaDto.coverImage,
      createExternalMediaDto.description,
      createExternalMediaDto.tags,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    await this.mediaService.remove(id);
    return { message: 'Media deleted successfully' };
  }
}
