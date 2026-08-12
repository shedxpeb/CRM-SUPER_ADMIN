import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../auth/services/audit.service';

@Module({
  controllers: [PlatformController],
  providers: [PlatformService, PrismaService, AuditService],
  exports: [PlatformService],
})
export class PlatformModule {}
