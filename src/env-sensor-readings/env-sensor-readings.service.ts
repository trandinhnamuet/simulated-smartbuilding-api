import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { EnvSensorReading } from './entities/env-sensor-reading.entity';
import { RoomsService } from '../rooms/rooms.service';
import { EnvSimulationService } from '../simulation/env-simulation.service';
import { QueryEnvReadingsDto } from './dto/query-env-readings.dto';
import { GenerateEnvReadingsDto } from './dto/generate-env-readings.dto';

@Injectable()
export class EnvSensorReadingsService {
  constructor(
    @InjectRepository(EnvSensorReading)
    private readonly readingsRepo: Repository<EnvSensorReading>,
    private readonly roomsService: RoomsService,
    private readonly envSimService: EnvSimulationService,
  ) {}

  async getLatestForRoom(roomId: string): Promise<EnvSensorReading | null> {
    return this.readingsRepo.findOne({
      where: { roomId },
      order: { timestamp: 'DESC' },
    });
  }

  async getReadingsForRoom(
    roomId: string,
    query: QueryEnvReadingsDto,
  ): Promise<{ data: EnvSensorReading[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 50, from, to, occupiedOnly } = query;
    const where: FindOptionsWhere<EnvSensorReading> = { roomId };
    if (occupiedOnly) where.isOccupied = true;
    if (from && to)   where.timestamp  = Between(new Date(from), new Date(to));

    const [data, total] = await this.readingsRepo.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  /** Generate a live ephemeral reading (not saved to DB) */
  async generateLive(roomId: string): Promise<Partial<EnvSensorReading>> {
    const room = await this.roomsService.findOne(roomId);
    const previous = await this.getLatestForRoom(roomId) ?? undefined;
    return this.envSimService.generateReading(room, previous);
  }

  /** Generate and persist N readings for a room */
  async generateAndSave(
    roomId: string,
    dto: GenerateEnvReadingsDto,
  ): Promise<EnvSensorReading[]> {
    const room     = await this.roomsService.findOne(roomId);
    const previous = await this.getLatestForRoom(roomId) ?? undefined;
    const { count = 1, intervalSec = 5 } = dto;

    const raw     = this.envSimService.generateBatch(room, count, intervalSec, previous);
    const entities = this.readingsRepo.create(raw as EnvSensorReading[]);
    return this.readingsRepo.save(entities);
  }

  /** Cross-room: all readings where PIR > 0 (occupied) */
  async getOccupiedReadings(
    query: QueryEnvReadingsDto,
  ): Promise<{ data: EnvSensorReading[]; total: number }> {
    const { page = 1, limit = 50, from, to } = query;
    const where: FindOptionsWhere<EnvSensorReading> = { isOccupied: true };
    if (from && to) where.timestamp = Between(new Date(from), new Date(to));

    const [data, total] = await this.readingsRepo.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['room'],
    });
    return { data, total };
  }

  /** Cross-room: get latest reading for every active room (dashboard snapshot) */
  async getLatestAllRooms(): Promise<EnvSensorReading[]> {
    return this.readingsRepo
      .createQueryBuilder('r')
      .distinctOn(['r.room_id'])
      .orderBy('r.room_id')
      .addOrderBy('r.timestamp', 'DESC')
      .leftJoinAndSelect('r.room', 'room')
      .where('room.is_active = true')
      .getMany();
  }

  /** High-CO2 alert: rooms where the latest reading exceeds threshold */
  async getHighCo2Rooms(threshold = 1000): Promise<EnvSensorReading[]> {
    return this.readingsRepo
      .createQueryBuilder('r')
      .distinctOn(['r.room_id'])
      .orderBy('r.room_id')
      .addOrderBy('r.timestamp', 'DESC')
      .leftJoinAndSelect('r.room', 'room')
      .where('r.co2_ppm > :threshold', { threshold })
      .getMany();
  }
}
