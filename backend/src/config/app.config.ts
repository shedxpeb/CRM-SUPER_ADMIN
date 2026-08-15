import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('nodeEnv', 'development');
  }

  get isProduction(): boolean {
    return this.configService.get<boolean>('isProduction', false);
  }

  get port(): number {
    return this.configService.get<number>('port', 8001);
  }

  get globalPrefix(): string {
    return this.configService.get<string>('globalPrefix', 'api/v1');
  }

  get frontendUrl(): string {
    return this.configService.get<string>('frontendUrl', 'http://localhost:3001');
  }

  get allowedOrigins(): string {
    // Accept several env key spellings (comma-separated) so existing Render
    // configs keep working regardless of which var name they set:
    //   allowedOrigins / ALLOWED_ORIGINS / FRONTEND_URL (via frontendUrl)
    const candidates = [
      this.configService.get<string>('allowedOrigins', ''),
      this.configService.get<string>('ALLOWED_ORIGINS', ''),
      this.frontendUrl,
    ];
    const merged = candidates
      .map((v) => (v || '').trim())
      .filter(Boolean)
      .join(',');
    return merged || 'http://localhost:3001';
  }

  get allowVercelPreview(): boolean {
    const raw = this.configService.get<string>('CORS_ALLOW_VERCEL_PREVIEW', 'true');
    return raw.toLowerCase() !== 'false';
  }

  get databaseUrl(): string {
    return this.configService.get<string>('database.url', '');
  }

  get jwtSecret(): string {
    return this.configService.get<string>('jwt.secret', '');
  }

  get jwtAccessExpiresIn(): string {
    return this.configService.get<string>('jwt.accessExpiresIn', '30m');
  }

  get jwtRefreshExpiresIn(): string {
    return this.configService.get<string>('jwt.refreshExpiresIn', '7d');
  }

  get bcryptRounds(): number {
    return this.configService.get<number>('security.bcryptRounds', 12);
  }

  get lockThreshold(): number {
    return this.configService.get<number>('security.lockThreshold', 7);
  }

  get lockDurationMinutes(): number {
    return this.configService.get<number>('security.lockDurationMinutes', 15);
  }

  get otpExpiryMinutes(): number {
    return this.configService.get<number>('security.otpExpiryMinutes', 10);
  }

  get maxOtpAttempts(): number {
    return this.configService.get<number>('security.maxOtpAttempts', 5);
  }

  get passwordHistorySize(): number {
    return this.configService.get<number>('security.passwordHistorySize', 10);
  }

  get rateLimitTtlSeconds(): number {
    return this.configService.get<number>('rateLimit.ttlSeconds', 60);
  }

  get rateLimitLimit(): number {
    return this.configService.get<number>('rateLimit.limit', 300);
  }

  get(key: string, fallback?: unknown): unknown {
    return this.configService.get(key, fallback);
  }
}
