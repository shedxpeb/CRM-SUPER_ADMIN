import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TransactionHelperService } from './transaction-helper.service';

@Global()
@Module({
  providers: [PrismaService, TransactionHelperService],
  exports: [PrismaService, TransactionHelperService],
})
export class DatabaseModule {}
