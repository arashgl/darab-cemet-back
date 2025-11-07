import { PartialType } from '@nestjs/mapped-types';
import { CreateLandingSettingDto } from './create-landing-setting.dto';

export class UpdateLandingSettingDto extends PartialType(
  CreateLandingSettingDto,
) {}
