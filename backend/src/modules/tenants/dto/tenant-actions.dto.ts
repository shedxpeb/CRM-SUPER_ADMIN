import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class SuspendTenantDto {
  @IsOptional()
  @IsString()
  @Length(10, 500)
  reason?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}
