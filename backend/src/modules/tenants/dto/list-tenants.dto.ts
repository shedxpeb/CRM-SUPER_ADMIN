import { IsEnum, IsOptional } from 'class-validator';
import { TenantStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListTenantsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}
