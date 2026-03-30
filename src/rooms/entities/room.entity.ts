import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EnvSensorReading } from '../../env-sensor-readings/entities/env-sensor-reading.entity';

@Entity({ name: 'rooms', schema: 'building' })
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Room identifier matching the dataset folder names, e.g. "413", "621A" */
  @Column({ name: 'room_code', unique: true, length: 20 })
  roomCode: string;

  @Column({ name: 'floor_number', type: 'int' })
  floorNumber: number;

  @Column({ name: 'location_zone', type: 'varchar', length: 50, nullable: true })
  locationZone: string | null;

  /** Approximate area in m² */
  @Column({ name: 'area_m2', type: 'float', nullable: true })
  areaM2: number | null;

  /** Room type: OFFICE, LAB, CONFERENCE, CORRIDOR, UTILITY */
  @Column({ name: 'room_type', length: 30, default: 'OFFICE' })
  roomType: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => EnvSensorReading, (r) => r.room)
  envSensorReadings: EnvSensorReading[];
}
