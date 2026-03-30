import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Machine } from '../../machines/entities/machine.entity';
import { MaintenanceType } from '../../common/enums/maintenance-type.enum';

@Entity({ name: 'maintenance_records', schema: 'building' })
export class MaintenanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'machine_id', type: 'uuid' })
  machineId: string;

  @ManyToOne(() => Machine, (machine) => machine.maintenanceRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'machine_id' })
  machine: Machine;

  @Column({ name: 'maintenance_type', type: 'varchar', length: 20 })
  maintenanceType: MaintenanceType;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'performed_at', type: 'timestamptz' })
  performedAt: Date;

  @Column({ name: 'performed_by', length: 100 })
  performedBy: string;

  @Column({ name: 'next_scheduled_date', type: 'date', nullable: true })
  nextScheduledDate: string | null;

  @Column({ name: 'failure_fixed', default: false })
  failureFixed: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
