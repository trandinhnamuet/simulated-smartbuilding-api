import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { SensorReadingsService } from './sensor-readings.service';
import { QueryReadingsDto } from './dto/query-readings.dto';
import { GenerateReadingsDto } from './dto/generate-readings.dto';

@Controller('api/v1/machines/:machineId/readings')
export class SensorReadingsController {
  constructor(private readonly sensorReadingsService: SensorReadingsService) {}

  /** GET /api/v1/machines/:machineId/readings — paginated historical readings */
  @Get()
  getReadings(
    @Param('machineId', ParseUUIDPipe) machineId: string,
    @Query() query: QueryReadingsDto,
  ) {
    return this.sensorReadingsService.getReadingsForMachine(machineId, query);
  }

  /** GET /api/v1/machines/:machineId/readings/latest — most recent persisted reading */
  @Get('latest')
  getLatest(@Param('machineId', ParseUUIDPipe) machineId: string) {
    return this.sensorReadingsService.getLatestForMachine(machineId);
  }

  /** GET /api/v1/machines/:machineId/readings/live — ephemeral simulated reading (not saved) */
  @Get('live')
  getLive(@Param('machineId', ParseUUIDPipe) machineId: string) {
    return this.sensorReadingsService.generateLive(machineId);
  }

  /** POST /api/v1/machines/:machineId/readings/generate — generate & save N readings */
  @Post('generate')
  generate(
    @Param('machineId', ParseUUIDPipe) machineId: string,
    @Body() dto: GenerateReadingsDto,
  ) {
    return this.sensorReadingsService.generateAndSave(machineId, dto);
  }
}

@Controller('api/v1/sensor-readings')
export class SensorReadingsGlobalController {
  constructor(private readonly sensorReadingsService: SensorReadingsService) {}

  /** GET /api/v1/sensor-readings/anomalies — all anomaly readings */
  @Get('anomalies')
  getAnomalies(@Query() query: QueryReadingsDto) {
    return this.sensorReadingsService.getAnomalies(query);
  }
}
