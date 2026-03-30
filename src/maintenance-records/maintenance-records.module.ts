import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceRecord } from './entities/maintenance-record.entity';
import { MaintenanceRecordsService } from './maintenance-records.service';
import { MaintenanceRecordsController } from './maintenance-records.controller';
import { MachinesModule } from '../machines/machines.module';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceRecord]), MachinesModule],
  providers: [MaintenanceRecordsService],
  controllers: [MaintenanceRecordsController],
})
export class MaintenanceRecordsModule {}
