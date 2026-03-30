import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Machine } from './entities/machine.entity';
import { CreateMachineDto } from './dto/create-machine.dto';
import { QueryMachinesDto } from './dto/query-machines.dto';
import { MACHINE_BASELINES } from '../simulation/machine-baselines';
import { MachineType } from '../common/enums/machine-type.enum';

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(Machine)
    private readonly machinesRepo: Repository<Machine>,
  ) {}

  async create(dto: CreateMachineDto): Promise<Machine> {
    const exists = await this.machinesRepo.findOne({
      where: { machineCode: dto.machineCode },
    });
    if (exists) throw new ConflictException(`Machine code "${dto.machineCode}" already exists`);

    const baseline = MACHINE_BASELINES[dto.machineType as MachineType];
    const machine = this.machinesRepo.create({
      ...dto,
      remainingUsefulLifeDays: baseline?.nominalRulDays ?? 365,
    });
    return this.machinesRepo.save(machine);
  }

  async findAll(query: QueryMachinesDto): Promise<{ data: Machine[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, machineType, locationZone, floorNumber } = query;

    const where: FindOptionsWhere<Machine> = {};
    if (machineType) where.machineType = machineType;
    if (locationZone) where.locationZone = locationZone;
    if (floorNumber) where.floorNumber = floorNumber;

    const [data, total] = await this.machinesRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { machineCode: 'ASC' },
    });

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Machine> {
    const machine = await this.machinesRepo.findOne({ where: { id } });
    if (!machine) throw new NotFoundException(`Machine ${id} not found`);
    return machine;
  }

  async findByCode(machineCode: string): Promise<Machine> {
    const machine = await this.machinesRepo.findOne({ where: { machineCode } });
    if (!machine) throw new NotFoundException(`Machine "${machineCode}" not found`);
    return machine;
  }

  async updateStatus(id: string, isActive: boolean): Promise<Machine> {
    const machine = await this.findOne(id);
    machine.isActive = isActive;
    return this.machinesRepo.save(machine);
  }

  async updateRuntimeStats(
    id: string,
    runtimeHours: number,
    cycleCount: number,
    remainingUsefulLifeDays: number,
    failureWithin7Days: boolean,
  ): Promise<void> {
    await this.machinesRepo.update(id, {
      totalRuntimeHours: runtimeHours,
      totalCycleCount: cycleCount,
      remainingUsefulLifeDays,
      failureWithin7Days,
    });
  }

  async count(): Promise<number> {
    return this.machinesRepo.count();
  }
}
