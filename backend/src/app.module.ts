import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { VersionHeaderInterceptor } from './common/interceptors/version-header.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { ImpersonationModule } from './modules/impersonation/impersonation.module';
import { SecurityModule } from './modules/security/security.module';
import { PlatformModule } from './modules/platform/platform.module';

@Module({
  imports: [
    AppConfigModule,
    ConfigModule,
    DatabaseModule,
    HealthModule,
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
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    TenantsModule,
    MonitoringModule,
    ImpersonationModule,
    SecurityModule,
    PlatformModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: VersionHeaderInterceptor },
  ],
})
export class AppModule {}
