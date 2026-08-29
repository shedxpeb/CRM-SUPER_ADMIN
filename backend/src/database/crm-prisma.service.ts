import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client-crm';
import { PrismaPg } from '@prisma/adapter-pg';

// Type definitions for Node.js globals
declare const process: NodeJS.Process;

@Injectable()
export class CrmPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CrmPrismaService.name);
  private pool: Pool;

  constructor() {
    const crmUrl = process.env.CRM_DATABASE_URL || process.env.DATABASE_URL || '';

    // Create pg Pool with SSL configuration to accept self-signed certificates
    const pool = new Pool({
      connectionString: crmUrl,
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
      // Tenant provisioning runs one interactive transaction with ~25
      // sequential statements (org + roles + modules + user). The 5s Prisma
      // default can expire under slow network conditions (P2028 "Transaction
      // not found"), so give provisioning room to breathe.
      transactionOptions: {
        maxWait: 10_000,
        timeout: 60_000,
      },
    });

    // Assign pool after super() is called
    this.pool = pool;
  }

  async onModuleInit() {
    const source = process.env.CRM_DATABASE_URL ? 'CRM_DATABASE_URL' : 'DATABASE_URL (fallback)';
    try {
      await this.$connect();
      // Verify the CRM schema is actually provisioned in the target database.
      // Tenant creation writes to these tables on every create, so a missing
      // CRM schema is the #1 cause of "POST /tenants 400" in production (the
      // platform tables exist, so login/health work while provisioning fails).
      const [orgCount, userCount] = await Promise.all([
        this.organization.count(),
        this.user.count(),
      ]);
      this.logger.log(
        `CRM database connected successfully (source: ${source}, host: ${this.safeHost()}). ` +
          `Schema OK — Organization rows: ${orgCount}, User rows: ${userCount}.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `CRM database check FAILED (source: ${source}, host: ${this.safeHost()}): ${message}. ` +
          `Tenant creation will keep failing with 400 until the CRM schema is provisioned. ` +
          `Fix: point CRM_DATABASE_URL at the CRM database and run ` +
          `npx prisma migrate deploy --schema=prisma/crm-schema.prisma (or prisma db push) against it.`,
      );
    }
  }

  private safeHost(): string {
    try {
      const url = process.env.CRM_DATABASE_URL || process.env.DATABASE_URL || '';
      return new URL(url).host;
    } catch {
      return 'unknown';
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
