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
} from '@nestjs/common';
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.landingSettingsService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateLandingSettingDto) {
    return this.landingSettingsService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateLandingSettingDto) {
    return this.landingSettingsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.landingSettingsService.remove(id);
  }
}
