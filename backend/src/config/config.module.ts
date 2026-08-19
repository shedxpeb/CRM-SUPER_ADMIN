import { Global, Module, Logger } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import configuration from './configuration';
import { AppConfigService } from './app.config';
import { validateEnv } from './env.validation';

const logger = new Logger('ConfigModule');

try {
  validateEnv();
  logger.log('Environment validation passed');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(`Environment validation failed: ${message}`);
  process.exit(1);
}

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigModule {}
