import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor(private configService: ConfigService) {
    const rawUrl = configService.get<string>('database.url') || '';
    const nodeEnv = configService.get<string>('nodeEnv', 'development');

    // Create pg Pool with SSL configuration to accept self-signed certificates
    const pool = new Pool({
      connectionString: rawUrl,
      max: 10,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    // Create Prisma adapter with the pool
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
    });

    // Assign pool after super() is called
    this.pool = pool;

    this.logger.log(`DATABASE_URL: ${rawUrl ? rawUrl.replace(/:[^:@]+@/, ':****@') : 'NOT SET'}`);
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
    await this.pool.end();
  }
}
