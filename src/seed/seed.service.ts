import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machine } from '../machines/entities/machine.entity';
import { MachineType } from '../common/enums/machine-type.enum';
import { MACHINE_BASELINES } from '../simulation/machine-baselines';

interface SeedMachine {
  machineCode: string;
  machineType: MachineType;
  locationZone: string;
  floorNumber: number;
  installDate: string;
}

const SEED_MACHINES: SeedMachine[] = [
  // Floor 1 — Production Zone A
  { machineCode: 'CNC_MILL_001', machineType: MachineType.CNC_MILL,     locationZone: 'Zone A', floorNumber: 1, installDate: '2021-03-15' },
  { machineCode: 'CNC_MILL_002', machineType: MachineType.CNC_MILL,     locationZone: 'Zone A', floorNumber: 1, installDate: '2021-04-10' },
  { machineCode: 'HYDRAULIC_001', machineType: MachineType.HYDRAULIC_PRESS, locationZone: 'Zone A', floorNumber: 1, installDate: '2020-07-22' },
  { machineCode: 'WELDER_001',   machineType: MachineType.WELDER,       locationZone: 'Zone A', floorNumber: 1, installDate: '2022-01-05' },
  { machineCode: 'CONVEYOR_001', machineType: MachineType.CONVEYOR,     locationZone: 'Zone A', floorNumber: 1, installDate: '2020-11-30' },

  // Floor 1 — Production Zone B
  { machineCode: 'ROBOT_001',    machineType: MachineType.ROBOT_ARM,    locationZone: 'Zone B', floorNumber: 1, installDate: '2023-02-18' },
  { machineCode: 'ROBOT_002',    machineType: MachineType.ROBOT_ARM,    locationZone: 'Zone B', floorNumber: 1, installDate: '2023-02-18' },
  { machineCode: 'INJECTION_001', machineType: MachineType.INJECTION_MOLD, locationZone: 'Zone B', floorNumber: 1, installDate: '2021-09-12' },
  { machineCode: 'CONVEYOR_002', machineType: MachineType.CONVEYOR,     locationZone: 'Zone B', floorNumber: 1, installDate: '2021-06-01' },

  // Floor 2 — Laser & Cutting
  { machineCode: 'LASER_001',    machineType: MachineType.LASER_CUTTER, locationZone: 'Zone C', floorNumber: 2, installDate: '2022-05-20' },
  { machineCode: 'LASER_002',    machineType: MachineType.LASER_CUTTER, locationZone: 'Zone C', floorNumber: 2, installDate: '2022-06-14' },
  { machineCode: 'CNC_MILL_003', machineType: MachineType.CNC_MILL,     locationZone: 'Zone C', floorNumber: 2, installDate: '2023-01-08' },
  { machineCode: 'PRINTER_001',  machineType: MachineType.THREE_D_PRINTER, locationZone: 'Zone C', floorNumber: 2, installDate: '2024-01-15' },

  // Floor 2 — Utilities
  { machineCode: 'COMPRESSOR_001', machineType: MachineType.COMPRESSOR, locationZone: 'Zone D', floorNumber: 2, installDate: '2019-08-05' },
  { machineCode: 'COMPRESSOR_002', machineType: MachineType.COMPRESSOR, locationZone: 'Zone D', floorNumber: 2, installDate: '2020-03-17' },
  { machineCode: 'PUMP_001',     machineType: MachineType.PUMP,         locationZone: 'Zone D', floorNumber: 2, installDate: '2020-09-28' },
  { machineCode: 'PUMP_002',     machineType: MachineType.PUMP,         locationZone: 'Zone D', floorNumber: 2, installDate: '2021-02-14' },

  // Floor 3 — Heat & Power
  { machineCode: 'FURNACE_001',  machineType: MachineType.FURNACE,      locationZone: 'Zone E', floorNumber: 3, installDate: '2018-11-11' },
  { machineCode: 'FURNACE_002',  machineType: MachineType.FURNACE,      locationZone: 'Zone E', floorNumber: 3, installDate: '2019-02-07' },
  { machineCode: 'TURBINE_001',  machineType: MachineType.TURBINE,      locationZone: 'Zone E', floorNumber: 3, installDate: '2017-06-30' },
  { machineCode: 'TURBINE_002',  machineType: MachineType.TURBINE,      locationZone: 'Zone E', floorNumber: 3, installDate: '2018-01-25' },

  // Floor 4 — R&D
  { machineCode: 'PRINTER_002',  machineType: MachineType.THREE_D_PRINTER, locationZone: 'Zone F', floorNumber: 4, installDate: '2024-03-01' },
  { machineCode: 'PRINTER_003',  machineType: MachineType.THREE_D_PRINTER, locationZone: 'Zone F', floorNumber: 4, installDate: '2024-03-01' },
  { machineCode: 'ROBOT_003',    machineType: MachineType.ROBOT_ARM,    locationZone: 'Zone F', floorNumber: 4, installDate: '2023-11-20' },
  { machineCode: 'LASER_003',    machineType: MachineType.LASER_CUTTER, locationZone: 'Zone F', floorNumber: 4, installDate: '2023-08-09' },
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Machine)
    private readonly machinesRepo: Repository<Machine>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.machinesRepo.count();
    if (count > 0) {
      this.logger.log(`Seed skipped — ${count} machines already present`);
      return;
    }

    this.logger.log('Seeding database with factory machines…');

    const machines = SEED_MACHINES.map((m) => {
      const baseline = MACHINE_BASELINES[m.machineType];
      // Simulate machines that have been running for some time
      const yearsRunning = (Date.now() - new Date(m.installDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
      const totalRuntimeHours = parseFloat((yearsRunning * 16 * (0.6 + Math.random() * 0.4)).toFixed(2));
      const totalCycleCount = Math.floor(totalRuntimeHours * (10 + Math.random() * 30));
      const rulFraction = Math.max(0.1, 1 - yearsRunning / (baseline.nominalRulDays / 365));
      const remainingUsefulLifeDays = parseFloat((baseline.nominalRulDays * rulFraction * (0.8 + Math.random() * 0.4)).toFixed(2));

      return this.machinesRepo.create({
        ...m,
        totalRuntimeHours,
        totalCycleCount,
        remainingUsefulLifeDays,
        failureWithin7Days: remainingUsefulLifeDays <= 7,
      });
    });

    await this.machinesRepo.save(machines);
    this.logger.log(`Seeded ${machines.length} machines successfully`);
  }
}
