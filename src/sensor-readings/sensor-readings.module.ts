import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensorReading } from './entities/sensor-reading.entity';
import { SensorReadingsService } from './sensor-readings.service';
import {
  SensorReadingsController,
  SensorReadingsGlobalController,
} from './sensor-readings.controller';
import { MachinesModule } from '../machines/machines.module';
import { SimulationModule } from '../simulation/simulation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SensorReading]),
    MachinesModule,
    SimulationModule,
  ],
  providers: [SensorReadingsService],
  controllers: [SensorReadingsController, SensorReadingsGlobalController],
  exports: [SensorReadingsService],
})
export class SensorReadingsModule {}
