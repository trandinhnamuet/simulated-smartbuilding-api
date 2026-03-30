import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvSensorReading } from './entities/env-sensor-reading.entity';
import { EnvSensorReadingsService } from './env-sensor-readings.service';
import {
  EnvSensorReadingsController,
  EnvSensorReadingsGlobalController,
} from './env-sensor-readings.controller';
import { RoomsModule } from '../rooms/rooms.module';
import { SimulationModule } from '../simulation/simulation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnvSensorReading]),
    RoomsModule,
    SimulationModule,
  ],
  providers: [EnvSensorReadingsService],
  controllers: [EnvSensorReadingsController, EnvSensorReadingsGlobalController],
  exports: [EnvSensorReadingsService],
})
export class EnvSensorReadingsModule {}
