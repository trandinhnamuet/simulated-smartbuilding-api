import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { MachinesModule } from './machines/machines.module';
import { SensorReadingsModule } from './sensor-readings/sensor-readings.module';
import { MaintenanceRecordsModule } from './maintenance-records/maintenance-records.module';
import { SimulationModule } from './simulation/simulation.module';
import { SeedModule } from './seed/seed.module';
import { RoomsModule } from './rooms/rooms.module';
import { EnvSensorReadingsModule } from './env-sensor-readings/env-sensor-readings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    SimulationModule,
    MachinesModule,
    SensorReadingsModule,
    MaintenanceRecordsModule,
    SeedModule,
    RoomsModule,
    EnvSensorReadingsModule,
  ],
})
export class AppModule {}

