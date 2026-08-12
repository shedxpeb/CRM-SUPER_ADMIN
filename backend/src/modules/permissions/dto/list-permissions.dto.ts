import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListPermissionsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  includeDeprecated?: boolean;
}
