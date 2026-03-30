import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';

@Entity({ name: 'env_sensor_readings', schema: 'building' })
export class EnvSensorReading {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne(() => Room, (room) => room.envSensorReadings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ type: 'timestamptz' })
  timestamp: Date;

  /** CO2 concentration in ppm — typical range 400–5000 */
  @Column({ name: 'co2_ppm', type: 'float' })
  co2Ppm: number;

  /** Relative humidity 0–100 % */
  @Column({ name: 'humidity_pct', type: 'float' })
  humidityPct: number;

  /** Room air temperature in °C */
  @Column({ name: 'temperature_c', type: 'float' })
  temperatureC: number;

  /** Luminosity in lux */
  @Column({ name: 'luminosity_lux', type: 'float' })
  luminosityLux: number;

  /**
   * PIR (Passive Infrared) motion sensor value.
   * 0 = room empty, >0 = occupancy detected (~6% of readings).
   */
  @Column({ name: 'pir_value', type: 'float' })
  pirValue: number;

  /** Derived boolean for convenience */
  @Column({ name: 'is_occupied', default: false })
  isOccupied: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
