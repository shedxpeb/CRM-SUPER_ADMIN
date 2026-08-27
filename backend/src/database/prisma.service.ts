import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function appendPoolParams(url: string, connectionLimit?: string, poolTimeout?: string): string {
  if (!url) return url;
  const hasConnectionLimit = /[?&]connection_limit=/.test(url);
  const hasPoolTimeout = /[?&]pool_timeout=/.test(url);

  const limit = connectionLimit || '20';
  const timeout = poolTimeout || '10';

  const separator = url.includes('?') ? '&' : '?';
  let result = url;
  if (!hasConnectionLimit) {
    result += `${separator}connection_limit=${limit}`;
  }
  if (!hasPoolTimeout) {
    result += `${separator}pool_timeout=${timeout}`;
  }
  return result;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    const rawUrl = configService.get<string>('database.url') || '';
    const connectionLimit = configService.get<string>('DB_CONNECTION_LIMIT');
    const poolTimeout = configService.get<string>('DB_POOL_TIMEOUT');
    const nodeEnv = configService.get<string>('nodeEnv', 'development');
    const dbUrl = appendPoolParams(rawUrl, connectionLimit, poolTimeout);

    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log: nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
    });

    this.logger.log(`DATABASE_URL: ${dbUrl ? dbUrl.replace(/:[^:@]+@/, ':****@') : 'NOT SET'}`);
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(maxAttempts = 5) {
    const rawUrl = this.configService.get<string>('database.url') || '';
    const target = this.describeTarget(rawUrl);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Database connected successfully');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Database connection attempt ${attempt}/${maxAttempts} failed: ${message}`,
        );
        if (attempt === maxAttempts) {
          this.logger.error(`Database connection failed after ${maxAttempts} attempts (${target})`);
          throw new Error(
            `Database is unavailable at ${target}. Start your database first, then retry backend startup.`,
          );
        }
        await sleep(attempt * 1000);
      }
    }
  }

  private describeTarget(connectionUrl: string): string {
    try {
      const url = new URL(connectionUrl);
      return `${url.hostname}:${url.port || '5432'}`;
    } catch {
      return 'configured database host';
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
