import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { SensorReading } from './entities/sensor-reading.entity';
import { MachinesService } from '../machines/machines.service';
import { SimulationService } from '../simulation/simulation.service';
import { QueryReadingsDto } from './dto/query-readings.dto';
import { GenerateReadingsDto } from './dto/generate-readings.dto';

@Injectable()
export class SensorReadingsService {
  constructor(
    @InjectRepository(SensorReading)
    private readonly readingsRepo: Repository<SensorReading>,
    private readonly machinesService: MachinesService,
    private readonly simulationService: SimulationService,
  ) {}

  async getLatestForMachine(machineId: string): Promise<SensorReading | null> {
    return this.readingsRepo.findOne({
      where: { machineId },
      order: { timestamp: 'DESC' },
    });
  }

  async getReadingsForMachine(
    machineId: string,
    query: QueryReadingsDto,
  ): Promise<{ data: SensorReading[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 50, from, to, anomaliesOnly } = query;

    const where: FindOptionsWhere<SensorReading> = { machineId };
    if (anomaliesOnly) where.isAnomaly = true;
    if (from && to) {
      where.timestamp = Between(new Date(from), new Date(to));
    }

    const [data, total] = await this.readingsRepo.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  /**
   * Generate and persist readings for a machine.
   */
  async generateAndSave(
    machineId: string,
    dto: GenerateReadingsDto,
  ): Promise<SensorReading[]> {
    const machine = await this.machinesService.findOne(machineId);
    const previous = await this.getLatestForMachine(machineId) ?? undefined;
    const { count = 1, intervalSec = 30 } = dto;

    const raw = this.simulationService.generateBatch(machine, count, intervalSec, previous);
    const entities = this.readingsRepo.create(raw as SensorReading[]);
    const saved = await this.readingsRepo.save(entities);

    // Update machine aggregate stats based on last reading
    const last = saved[saved.length - 1];
    await this.machinesService.updateRuntimeStats(
      machineId,
      last.runtimeHours,
      last.cycleCount,
      last.remainingUsefulLifeDays,
      last.failureWithin7Days,
    );

    return saved;
  }

  /**
   * Generate a reading without persisting it (live preview).
   */
  async generateLive(machineId: string): Promise<Partial<SensorReading>> {
    const machine = await this.machinesService.findOne(machineId);
    const previous = await this.getLatestForMachine(machineId) ?? undefined;
    return this.simulationService.generateReading(machine, previous);
  }

  async getAnomalies(query: QueryReadingsDto): Promise<{ data: SensorReading[]; total: number }> {
    const { page = 1, limit = 50, from, to } = query;
    const where: FindOptionsWhere<SensorReading> = { isAnomaly: true };
    if (from && to) where.timestamp = Between(new Date(from), new Date(to));

    const [data, total] = await this.readingsRepo.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['machine'],
    });
    return { data, total };
  }
}
