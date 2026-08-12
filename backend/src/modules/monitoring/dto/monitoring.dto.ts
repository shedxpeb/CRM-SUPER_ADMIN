import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AuditSeverity, ErrorSeverity, ErrorStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListAuditLogsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsString()
  actorEmail?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  targetType?: string;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsEnum(AuditSeverity)
  severity?: AuditSeverity;
}

export class ListErrorsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ErrorStatus)
  status?: ErrorStatus;

  @IsOptional()
  @IsEnum(ErrorSeverity)
  severity?: ErrorSeverity;

  @IsOptional()
  @IsString()
  service?: string;
}
