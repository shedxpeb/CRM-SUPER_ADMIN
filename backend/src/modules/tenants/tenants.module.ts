import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantOpsController } from './tenant-ops.controller';
import { TenantOpsService } from './tenant-ops.service';
import { AuthModule } from '../auth/auth.module';
import { CrmPrismaService } from '../../database/crm-prisma.service';

@Module({
  imports: [AuthModule],
  controllers: [TenantsController, TenantOpsController],
  providers: [TenantsService, TenantOpsService, CrmPrismaService],
  exports: [TenantsService, TenantOpsService],
})
export class TenantsModule {}
