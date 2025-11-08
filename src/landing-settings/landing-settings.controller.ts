import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { LandingSettingsService } from './landing-settings.service';
import { CreateLandingSettingDto } from './dto/create-landing-setting.dto';
import { UpdateLandingSettingDto } from './dto/update-landing-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('landing-settings')
@UseGuards(JwtAuthGuard)
export class LandingSettingsController {
  constructor(
    private readonly landingSettingsService: LandingSettingsService,
  ) {}

  @Get()
  findAll() {
    return this.landingSettingsService.findAll();
  }

  @Get('key/:key')
  findByKey(@Param('key') key: string) {
    return this.landingSettingsService.findByKey(key);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.landingSettingsService.findOne(id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'landing-settings');
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
  create(
    @Body() createDto: CreateLandingSettingDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      createDto.image = `uploads/landing-settings/${file.filename}`;
    }
    return this.landingSettingsService.create(createDto);
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'landing-settings');
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
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLandingSettingDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      updateDto.image = `uploads/landing-settings/${file.filename}`;
    }
    return this.landingSettingsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.landingSettingsService.remove(id);
  }
}
