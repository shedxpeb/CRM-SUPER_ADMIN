import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class AssignPermissionsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  permissionKeys: string[];
}
