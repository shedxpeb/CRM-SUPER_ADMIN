import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client-crm';

// Type definitions for Node.js globals
declare const process: NodeJS.Process;

@Injectable()
export class CrmPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CrmPrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.CRM_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('CRM database connected successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`CRM database connection failed: ${message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
