import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

import { PostsService, PostFilters } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PostSection } from './entities/post.entity';

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
  ) {
    const filters: PostFilters = {};

    if (section) filters.section = section as PostSection;
    if (title) filters.title = title;
    if (tags) filters.tags = tags.split(',');

    return this.postsService.findAll(
      parseInt(page, 10),
      parseInt(limit, 10),
      Object.keys(filters).length > 0 ? filters : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('leadPicture', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'lead-pictures');
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
  async create(
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() leadPicture: Express.Multer.File,
    @Req() req: any,
  ) {
    if (leadPicture) {
      // Update the DTO with the file path
      createPostDto.leadPicture = `uploads/lead-pictures/${leadPicture.filename}`;
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
    FileInterceptor('leadPicture', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'lead-pictures');
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
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() leadPicture: Express.Multer.File,
  ) {
    if (leadPicture) {
      // Update the DTO with the file path
      updatePostDto.leadPicture = `uploads/lead-pictures/${leadPicture.filename}`;
    }

    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}
