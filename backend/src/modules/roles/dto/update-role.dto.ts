import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Matches(/^[A-Z0-9_]+$/, { message: 'name must be uppercase letters, digits or underscore' })
  name?: string;

  @IsOptional()
  @IsString()
  @Length(3, 500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  permissionKeys?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}
