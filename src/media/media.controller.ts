import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Media, MediaType } from './entities/media.entity';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('type') type?: MediaType,
  ) {
    const [items, total] = await this.mediaService.findAll(+page, +limit, type);

    return {
      data: items,
      meta: {
        currentPage: +page,
        itemsPerPage: +limit,
        totalItems: total,
        totalPages: Math.ceil(total / +limit),
      },
    };
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    await this.mediaService.remove(id);
    return { message: 'Media deleted successfully' };
  }
}
