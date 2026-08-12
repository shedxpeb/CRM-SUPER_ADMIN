import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { TenantStatus } from '@prisma/client';

export class CreateTenantDto {
  @IsString()
  @Length(3, 100)
  name: string;

  @IsString()
  @Length(3, 50)
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase alphanumeric with dashes' })
  slug: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(5, 20)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(3, 100)
  domain?: string;

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxUsers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxStorageGB?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
