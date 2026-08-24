import { Global, Module, Logger } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import configuration from './configuration';
import { AppConfigService } from './app.config';
import { validateEnv } from './env.validation';

const logger = new Logger('ConfigModule');

/**
 * ConfigModule — production-safe configuration loading.
 *
 * The validate callback runs AFTER NestConfigModule has loaded the appropriate
 * .env file (e.g. `.env.production` when NODE_ENV=production). This ensures
 * env validation sees production secrets, not missing/dev placeholders.
 *
 * Pattern matches ADMIN-CRM backend config.module.ts for consistency.
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      load: [configuration],
      validate: (config) => {
        try {
          validateEnv(config);
          logger.log('Environment validation passed');
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          logger.error(`Environment validation failed: ${message}`);
          // Don't exit in development to allow debugging
          if (process.env.NODE_ENV === 'production') {
            process.exit(1);
          }
        }
        return { ...config, ...configuration() };
      },
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigModule {}
