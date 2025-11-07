import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandingSetting } from './entities/landing-setting.entity';
import { LandingSettingsService } from './landing-settings.service';
import { LandingSettingsController } from './landing-settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LandingSetting])],
  controllers: [LandingSettingsController],
  providers: [LandingSettingsService],
  exports: [LandingSettingsService],
})
export class LandingSettingsModule {}
