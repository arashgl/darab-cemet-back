import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LandingSetting } from './entities/landing-setting.entity';
import { CreateLandingSettingDto } from './dto/create-landing-setting.dto';
import { UpdateLandingSettingDto } from './dto/update-landing-setting.dto';

@Injectable()
export class LandingSettingsService {
  constructor(
    @InjectRepository(LandingSetting)
    private readonly landingSettingRepo: Repository<LandingSetting>,
  ) {}

  findAll() {
    return this.landingSettingRepo.find();
  }

  async findOne(id: string) {
    const setting = await this.landingSettingRepo.findOneBy({ id });
    if (!setting) {
      throw new NotFoundException(`Landing setting with ID ${id} not found`);
    }
    return setting;
  }

  async create(createDto: CreateLandingSettingDto) {
    const existingSetting = await this.landingSettingRepo.findOneBy({
      key: createDto.key,
    });
    if (existingSetting) {
      throw new ConflictException(
        `Landing setting with key '${createDto.key}' already exists`,
      );
    }

    const setting = this.landingSettingRepo.create(createDto);
    return this.landingSettingRepo.save(setting);
  }

  async update(id: string, updateDto: UpdateLandingSettingDto) {
    const setting = await this.findOne(id);

    if (updateDto.key && updateDto.key !== setting.key) {
      const existingSetting = await this.landingSettingRepo.findOneBy({
        key: updateDto.key,
      });
      if (existingSetting) {
        throw new ConflictException(
          `Landing setting with key '${updateDto.key}' already exists`,
        );
      }
    }

    Object.assign(setting, updateDto);
    return this.landingSettingRepo.save(setting);
  }

  async remove(id: string) {
    const setting = await this.findOne(id);
    await this.landingSettingRepo.remove(setting);
    return { message: 'Setting deleted successfully' };
  }
}
