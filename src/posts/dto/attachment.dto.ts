import { IsNotEmpty, IsString } from 'class-validator';

export class AttachmentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  url: string;
}
