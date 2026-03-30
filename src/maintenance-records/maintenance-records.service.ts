import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceRecord } from './entities/maintenance-record.entity';
import { CreateMaintenanceRecordDto } from './dto/create-maintenance-record.dto';
import { MachinesService } from '../machines/machines.service';

@Injectable()
export class MaintenanceRecordsService {
  constructor(
    @InjectRepository(MaintenanceRecord)
    private readonly recordsRepo: Repository<MaintenanceRecord>,
    private readonly machinesService: MachinesService,
  ) {}

  async create(machineId: string, dto: CreateMaintenanceRecordDto): Promise<MaintenanceRecord> {
    // verify machine exists
    await this.machinesService.findOne(machineId);

    const record = this.recordsRepo.create({
      machineId,
      ...dto,
      failureFixed: dto.failureFixed ?? false,
      notes: dto.notes ?? null,
      nextScheduledDate: dto.nextScheduledDate ?? null,
    });
    return this.recordsRepo.save(record);
  }

  async findAllForMachine(
    machineId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: MaintenanceRecord[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.recordsRepo.findAndCount({
      where: { machineId },
      order: { performedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<MaintenanceRecord> {
    const record = await this.recordsRepo.findOne({ where: { id } });
    if (!record) throw new NotFoundException(`Maintenance record ${id} not found`);
    return record;
  }
}
