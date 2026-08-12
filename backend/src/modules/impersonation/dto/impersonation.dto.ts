import { IsOptional, IsString, Length } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ImpersonateDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  targetUserId?: string;
}

export class ListImpersonationLogsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  superAdminEmail?: string;

  @IsOptional()
  @IsString()
  active?: string;
}

export class EndImpersonationDto {
  @IsOptional()
  @IsString()
  @Length(3, 500)
  reason?: string;
}
