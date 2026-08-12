import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { LogLevel } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListApiLogsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  statusCode?: number;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsString()
  requestId?: string;
}

export class ListSlowQueriesDto extends PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  minDurationMs?: number;
}

export class ListSystemLogsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(LogLevel)
  level?: LogLevel;

  @IsOptional()
  @IsString()
  component?: string;
}
