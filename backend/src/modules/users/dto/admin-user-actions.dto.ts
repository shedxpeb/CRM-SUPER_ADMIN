import { IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

export class AdminResetPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'password must contain at least one lowercase, uppercase, digit and special character',
  })
  newPassword: string;
}

export class SuspendUserDto {
  @IsOptional()
  @IsString()
  @Length(3, 500)
  reason?: string;
}
