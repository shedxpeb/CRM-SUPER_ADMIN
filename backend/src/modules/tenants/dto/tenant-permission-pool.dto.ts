import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsBoolean, IsString, IsEnum } from 'class-validator';

export enum TenantTier {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export class SetTenantPermissionPoolDto {
  @ApiProperty({
    description: 'CRM permissions allowed for this tenant',
    example: ['finance:list', 'finance:read', 'finance:create'],
  })
  @IsArray()
  @IsString({ each: true })
  allowedPermissions: string[];

  @ApiProperty({
    description: 'CRM permissions explicitly denied (blacklist override)',
    required: false,
    example: ['finance:delete', 'finance:approve'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deniedPermissions?: string[];

  @ApiProperty({
    description: 'Subscription tier',
    enum: TenantTier,
    default: TenantTier.STANDARD,
  })
  @IsOptional()
  @IsEnum(TenantTier)
  tier?: TenantTier;

  @ApiProperty({
    description: 'Whether tenant can create custom roles',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowCustomRoles?: boolean;

  @ApiProperty({
    description: 'Whether tenant users can have permission overrides',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowUserOverrides?: boolean;
}

export interface TenantPermissionPoolConfig {
  allowedPermissions: string[];
  deniedPermissions?: string[];
  tier?: TenantTier;
  allowCustomRoles?: boolean;
  allowUserOverrides?: boolean;
}
