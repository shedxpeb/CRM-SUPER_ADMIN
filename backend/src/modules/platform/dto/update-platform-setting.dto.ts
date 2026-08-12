import { IsOptional, IsString } from 'class-validator';

export class UpdatePlatformSettingDto {
  @IsOptional()
  value: unknown;

  @IsOptional()
  @IsString()
  description?: string;
}
