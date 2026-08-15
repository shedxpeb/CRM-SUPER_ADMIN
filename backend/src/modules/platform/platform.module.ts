import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { MailService } from './mail.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../auth/services/audit.service';

@Module({
  controllers: [PlatformController],
  providers: [PlatformService, MailService, PrismaService, AuditService],
  exports: [PlatformService, MailService],
})
export class PlatformModule {}
