import { IsBoolean, IsDateString, IsOptional, IsString, Length } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

// ── Blocked IPs ─────────────────────────────────────────────────────────────

export class CreateBlockedIpDto {
  @IsString()
  ipAddress: string;

  @IsOptional()
  @IsString()
  @Length(3, 500)
  reason?: string;

  @IsOptional()
  @IsDateString()
  blockedUntil?: string;
}

export class ListBlockedIpsDto extends PaginationDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

// ── Sessions / Login attempts ───────────────────────────────────────────────

export class ListSessionsDto extends PaginationDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class ListLoginAttemptsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsBoolean()
  success?: boolean;
}
