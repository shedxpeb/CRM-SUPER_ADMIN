import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
    this.logger.log(`DATABASE_URL: ${dbUrl ? dbUrl.replace(/:[^:@]+@/, ':****@') : 'NOT SET'}`);
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.warn(
        'Database connection failed. Application will start but database features will not work.',
      );
      this.logger.warn(`Error: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
