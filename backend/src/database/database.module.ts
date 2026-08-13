import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CrmPrismaService } from './crm-prisma.service';
import { TransactionHelperService } from './transaction-helper.service';

@Global()
@Module({
  providers: [PrismaService, CrmPrismaService, TransactionHelperService],
  exports: [PrismaService, CrmPrismaService, TransactionHelperService],
})
export class DatabaseModule {}
