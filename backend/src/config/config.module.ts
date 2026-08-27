import { Global, Module, Logger } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import configuration from './configuration';
import { AppConfigService } from './app.config';
import { validateEnv, applyConfigToProcessEnv } from './env.validation';

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
      // Production reads .env.production only; development uses .env.
      // Use absolute path to ensure correct file is loaded regardless of cwd.
      envFilePath: (() => {
        const isProduction = process.env.NODE_ENV === 'production';
        const hasProductionEnv = fs.existsSync(path.join(process.cwd(), '.env.production'));
        if (isProduction || hasProductionEnv) {
          return [
            path.join(process.cwd(), '.env.production'),
            path.join(process.cwd(), 'production.env'),
          ];
        }
        return [path.join(process.cwd(), '.env')];
      })(),
      load: [configuration],
      validate: (config) => {
        try {
          applyConfigToProcessEnv(config);
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
