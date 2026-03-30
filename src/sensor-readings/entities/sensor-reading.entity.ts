import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Machine } from '../../machines/entities/machine.entity';

@Entity({ name: 'sensor_readings', schema: 'building' })
export class SensorReading {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'machine_id', type: 'uuid' })
  machineId: string;

  @ManyToOne(() => Machine, (machine) => machine.sensorReadings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'machine_id' })
  machine: Machine;

  @Column({ type: 'timestamptz' })
  timestamp: Date;

  /** °C */
  @Column({ name: 'temperature_c', type: 'float' })
  temperatureC: number;

  /** mm/s² */
  @Column({ name: 'vibration_ms2', type: 'float' })
  vibrationMs2: number;

  /** dB */
  @Column({ name: 'sound_db', type: 'float' })
  soundDb: number;

  /** kW */
  @Column({ name: 'power_kw', type: 'float' })
  powerKw: number;

  /** 0–100 % */
  @Column({ name: 'oil_level_pct', type: 'float' })
  oilLevelPct: number;

  /** 0–100 % — null for machines without a coolant system */
  @Column({ name: 'coolant_level_pct', type: 'float', nullable: true })
  coolantLevelPct: number | null;

  /** W — only for LASER_CUTTER */
  @Column({ name: 'laser_intensity_w', type: 'float', nullable: true })
  laserIntensityW: number | null;

  /** bar — HYDRAULIC_PRESS, INJECTION_MOLD */
  @Column({ name: 'hydraulic_pressure_bar', type: 'float', nullable: true })
  hydraulicPressureBar: number | null;

  /** RPM — CNC_MILL */
  @Column({ name: 'spindle_speed_rpm', type: 'float', nullable: true })
  spindleSpeedRpm: number | null;

  /** mm — CNC_MILL */
  @Column({ name: 'tool_wear_mm', type: 'float', nullable: true })
  toolWearMm: number | null;

  /** bar — COMPRESSOR, PUMP */
  @Column({ name: 'pressure_bar', type: 'float', nullable: true })
  pressureBar: number | null;

  /** L/min — PUMP */
  @Column({ name: 'flow_rate_l_min', type: 'float', nullable: true })
  flowRateLMin: number | null;

  @Column({ name: 'runtime_hours', type: 'float' })
  runtimeHours: number;

  @Column({ name: 'cycle_count', type: 'int' })
  cycleCount: number;

  @Column({ name: 'is_anomaly', default: false })
  isAnomaly: boolean;

  @Column({ name: 'remaining_useful_life_days', type: 'float' })
  remainingUsefulLifeDays: number;

  @Column({ name: 'failure_within_7_days', default: false })
  failureWithin7Days: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
