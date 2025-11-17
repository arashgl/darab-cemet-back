import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';

import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostSection } from './entities/post.entity';
import { PostFilters, PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('section') section?: string,
    @Query('title') title?: string,
    @Query('tags') tags?: string,
    @Query('categoryId') categoryId?: string,
    @Query('sort') sort?: string,
  ) {
    const filters: PostFilters = {};

    if (section) filters.section = section as PostSection;
    if (title) filters.title = title;
    if (tags) filters.tags = tags.split(',');
    if (categoryId) filters.categoryId = parseInt(categoryId, 10);

    return this.postsService.findAll(
      parseInt(page, 10),
      parseInt(limit, 10),
      Object.keys(filters).length > 0 ? filters : undefined,
      sort,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post(':id/view')
  async recordView(@Param('id') id: string) {
    return this.postsService.incrementViews(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'leadPicture', maxCount: 1 },
        { name: 'attachments', maxCount: 50 },
        { name: 'gallery', maxCount: 20 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            let uploadPath: string;
            if (file.fieldname === 'leadPicture') {
              uploadPath = join(process.cwd(), 'uploads', 'lead-pictures');
            } else if (file.fieldname === 'gallery') {
              uploadPath = join(process.cwd(), 'uploads', 'gallery');
            } else {
              uploadPath = join(process.cwd(), 'uploads', 'attachments');
            }
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
          if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
            cb(null, true);
          } else {
            if (file.fieldname != 'attachments') {
              cb(new Error('Only image files are allowed!'), false);
            }
            cb(null, true);
          }
        },
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB limit per file
        },
      },
    ),
  )
  async create(
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles()
    files: {
      leadPicture?: Express.Multer.File[];
      attachments?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
    @Req() req: any,
  ) {
    if (files?.leadPicture?.[0]) {
      // Update the DTO with the lead picture file path
      createPostDto.leadPicture = `uploads/lead-pictures/${files.leadPicture[0].filename}`;
    }

    if (files?.attachments?.[0]) {
      // Update the DTO with the attachments file paths
      createPostDto.attachments = files.attachments.map(
        (file) => `uploads/attachments/${file.filename}`,
      );
    }

    if (files?.gallery) {
      // Update the DTO with the gallery file paths
      createPostDto.gallery = files.gallery.map(
        (file) => `uploads/gallery/${file.filename}`,
      );
    }

    return this.postsService.create(createPostDto, req.user);
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return await this.postsService.addComment(id, createCommentDto);
  }

  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    return await this.postsService.getComments(id);
  }

  @Post('upload-content-images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'content-images');
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
    }),
  )
  uploadContentImages(@UploadedFiles() files: Express.Multer.File[]) {
    const fileUrls = files.map(
      (file) => `uploads/content-images/${file.filename}`,
    );
    return { urls: fileUrls };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'leadPicture', maxCount: 1 },
        { name: 'attachments', maxCount: 50 },
        { name: 'gallery', maxCount: 20 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            let uploadPath: string;
            if (file.fieldname === 'leadPicture') {
              uploadPath = join(process.cwd(), 'uploads', 'lead-pictures');
            } else if (file.fieldname === 'gallery') {
              uploadPath = join(process.cwd(), 'uploads', 'gallery');
            } else {
              uploadPath = join(process.cwd(), 'uploads', 'attachments');
            }
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
          if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
            cb(null, true);
          } else {
            cb(new Error('Only image files are allowed!'), false);
          }
        },
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB limit per file
        },
      },
    ),
  )
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFiles()
    files: {
      leadPicture?: Express.Multer.File[];
      attachments?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
  ) {
    if (files?.leadPicture?.[0]) {
      // Update the DTO with the lead picture file path
      updatePostDto.leadPicture = `uploads/lead-pictures/${files.leadPicture[0].filename}`;
    }

    if (files?.attachments?.[0]) {
      // Update the DTO with the attachments file paths
      updatePostDto.attachments = files.attachments.map(
        (file) => `uploads/attachments/${file.filename}`,
      );
    }

    if (files?.gallery) {
      // Update the DTO with the gallery file paths
      updatePostDto.gallery = files.gallery.map(
        (file) => `uploads/gallery/${file.filename}`,
      );
    }

    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}
