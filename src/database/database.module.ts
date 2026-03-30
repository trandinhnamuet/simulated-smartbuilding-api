import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Machine } from '../machines/entities/machine.entity';
import { SensorReading } from '../sensor-readings/entities/sensor-reading.entity';
import { MaintenanceRecord } from '../maintenance-records/entities/maintenance-record.entity';
import { Room } from '../rooms/entities/room.entity';
import { EnvSensorReading } from '../env-sensor-readings/entities/env-sensor-reading.entity';
import { InitialSchema1711111111111 } from '../migrations/1711111111111-InitialSchema';
import { RoomsEnvSchema1711111111112 } from '../migrations/1711111111112-RoomsEnvSchema';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host:     config.get<string>('DB_HOST'),
        port:     config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        ssl: { rejectUnauthorized: false },
        entities: [Machine, SensorReading, MaintenanceRecord, Room, EnvSensorReading],
        migrations: [InitialSchema1711111111111, RoomsEnvSchema1711111111112],
        migrationsRun: true,   // ← auto-run pending migrations on startup
        synchronize: false,    // never use synchronize in production
        logging: ['migration', 'error'],
      }),
    }),
  ],
})
export class DatabaseModule {}
