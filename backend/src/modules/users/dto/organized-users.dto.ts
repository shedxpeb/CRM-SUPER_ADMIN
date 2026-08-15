import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class OrganizedUsersDto extends PaginationDto {
  /** Platform tenant (organization) id to filter by */
  @IsOptional()
  @IsString()
  organizationId?: string;

  /** CRM system role to filter by (e.g. OWNER, ADMIN, MANAGER, EMPLOYEE) */
  @IsOptional()
  @IsString()
  role?: string;

  /** active | inactive */
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
