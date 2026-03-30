import { Module } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { EnvSimulationService } from './env-simulation.service';

@Module({
  providers: [SimulationService, EnvSimulationService],
  exports: [SimulationService, EnvSimulationService],
})
export class SimulationModule {}
