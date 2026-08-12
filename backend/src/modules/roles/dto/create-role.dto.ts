import { ArrayMaxSize, IsArray, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @Length(2, 50)
  @Matches(/^[A-Z0-9_]+$/, { message: 'name must be uppercase letters, digits or underscore' })
  name: string;

  @IsOptional()
  @IsString()
  @Length(3, 500)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  permissionKeys?: string[];
}
