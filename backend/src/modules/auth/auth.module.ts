import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { LoginProtectionService } from './services/login-protection.service';
import { AuditService } from './services/audit.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>('jwt.secret') || 'dev-secret',
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessExpiresIn', '30m') as NonNullable<
            JwtModuleOptions['signOptions']
          >['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, SessionService, LoginProtectionService, AuditService],
  exports: [AuthService, TokenService, SessionService, AuditService, JwtModule],
})
export class AuthModule {}
