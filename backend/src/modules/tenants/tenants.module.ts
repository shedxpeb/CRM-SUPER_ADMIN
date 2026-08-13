import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantOpsController } from './tenant-ops.controller';
import { TenantOpsService } from './tenant-ops.service';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [TenantsController, TenantOpsController],
  providers: [TenantsService, TenantOpsService],
  exports: [TenantsService, TenantOpsService],
})
export class TenantsModule {}
