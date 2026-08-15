import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsArray,
  Length,
  MaxLength,
} from 'class-validator';

// ── Tenant users ─────────────────────────────────────────────────────────────

export class CreateTenantUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  mobile?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  designation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  role?: string;

  @IsOptional()
  @IsString()
  @Length(8, 72)
  password?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTenantUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  mobile?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  designation?: string;
}

export class SetTenantUserActiveDto {
  @IsBoolean()
  isActive: boolean;
}

export class ResetTenantUserPasswordDto {
  @IsOptional()
  @IsString()
  @Length(8, 128)
  newPassword?: string;
}

export class AssignTenantUserRoleDto {
  @IsString()
  roleId: string;
}

// ── Tenant roles ──────────────────────────────────────────────────────────────

export class CreateTenantRoleDto {
  @IsString()
  @Length(2, 80)
  name: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class UpdateTenantRoleDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;
}

export class SetTenantRolePermissionsDto {
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

export class SetTenantUserPermissionsDto {
  // Permission keys explicitly granted to the user (beyond their roles).
  @IsArray()
  @IsString({ each: true })
  granted: string[];

  // Permission keys explicitly denied to the user (overrides role grants).
  @IsArray()
  @IsString({ each: true })
  denied: string[];
}

export class SetTenantUserModulesDto {
  // Module keys explicitly allowed for the user (re-enables even if org off).
  @IsArray()
  @IsString({ each: true })
  allowed: string[];

  // Module keys explicitly denied for the user (deny wins over org default).
  @IsArray()
  @IsString({ each: true })
  denied: string[];
}
