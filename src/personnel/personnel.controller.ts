import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePersonnelDto, UpdatePersonnelDto } from './dto';
import { Personnel, PersonnelType } from './entities/personnel.entity';
import { PersonnelFilters, PersonnelService } from './personnel.service';

@Controller('personnel')
export class PersonnelController {
  constructor(private readonly personnelService: PersonnelService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'personnel');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `personnel-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed!'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async create(
    @Body() createPersonnelDto: CreatePersonnelDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<Personnel> {
    if (image) {
      createPersonnelDto.image = `/uploads/personnel/${image.filename}`;
    }
    return await this.personnelService.create(createPersonnelDto);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('type') type?: PersonnelType,
    @Query('name') name?: string,
    @Query('position') position?: string,
    @Query('search') search?: string,
  ) {
    const filters: PersonnelFilters = {};

    if (type) filters.type = type;
    if (name) filters.name = name;
    if (position) filters.position = position;

    return this.personnelService.findAll(
      parseInt(page, 10),
      parseInt(limit, 10),
      Object.keys(filters).length > 0 ? filters : undefined,
      search,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Personnel> {
    return await this.personnelService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'personnel');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `personnel-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed!'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() updatePersonnelDto: UpdatePersonnelDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<Personnel> {
    if (image) {
      updatePersonnelDto.image = `/uploads/personnel/${image.filename}`;
    }
    return await this.personnelService.update(id, updatePersonnelDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('id') id: string): Promise<void> {
    return await this.personnelService.remove(id);
  }
}
