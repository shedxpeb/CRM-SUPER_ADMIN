import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { ObservabilityController } from './observability.controller';
import { ObservabilityService } from './observability.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MonitoringController, ObservabilityController],
  providers: [MonitoringService, ObservabilityService],
  exports: [MonitoringService, ObservabilityService],
})
export class MonitoringModule {}
