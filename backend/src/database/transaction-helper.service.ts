import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export type TxClient = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

/**
 * Wraps interactive transactions. Every multi-step mutation in the platform must run
 * inside an interactive transaction (ACID guarantee, Principle 3 in PLATFORM_ARCHITECTURE).
 */
@Injectable()
export class TransactionHelperService {
  constructor(private readonly prisma: PrismaService) {}

  async execute<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => fn(tx as TxClient));
  }
}
