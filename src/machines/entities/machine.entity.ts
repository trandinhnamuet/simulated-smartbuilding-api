import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MachineType } from '../../common/enums/machine-type.enum';
import { SensorReading } from '../../sensor-readings/entities/sensor-reading.entity';
import { MaintenanceRecord } from '../../maintenance-records/entities/maintenance-record.entity';

@Entity({ name: 'machines', schema: 'building' })
export class Machine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Business identifier, e.g. "CNC_MILL_001" */
  @Column({ name: 'machine_code', unique: true, length: 50 })
  machineCode: string;

  @Column({ name: 'machine_type', type: 'varchar', length: 50 })
  machineType: MachineType;

  @Column({ name: 'location_zone', length: 50 })
  locationZone: string;

  @Column({ name: 'floor_number', type: 'int' })
  floorNumber: number;

  @Column({ name: 'install_date', type: 'date' })
  installDate: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'total_runtime_hours', type: 'float', default: 0 })
  totalRuntimeHours: number;

  @Column({ name: 'total_cycle_count', type: 'int', default: 0 })
  totalCycleCount: number;

  @Column({ name: 'remaining_useful_life_days', type: 'float', nullable: true })
  remainingUsefulLifeDays: number;

  @Column({ name: 'failure_within_7_days', default: false })
  failureWithin7Days: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => SensorReading, (reading) => reading.machine)
  sensorReadings: SensorReading[];

  @OneToMany(() => MaintenanceRecord, (record) => record.machine)
  maintenanceRecords: MaintenanceRecord[];
}
