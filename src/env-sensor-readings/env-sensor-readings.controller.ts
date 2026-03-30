import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { EnvSensorReadingsService } from './env-sensor-readings.service';
import { QueryEnvReadingsDto } from './dto/query-env-readings.dto';
import { GenerateEnvReadingsDto } from './dto/generate-env-readings.dto';

/**
 * Per-room environmental sensor endpoints
 * Base: /api/v1/rooms/:roomId/env-readings
 */
@Controller('api/v1/rooms/:roomId/env-readings')
export class EnvSensorReadingsController {
  constructor(private readonly envService: EnvSensorReadingsService) {}

  /** Paginated historical readings */
  @Get()
  getReadings(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Query() query: QueryEnvReadingsDto,
  ) {
    return this.envService.getReadingsForRoom(roomId, query);
  }

  /** Most recent persisted reading */
  @Get('latest')
  getLatest(@Param('roomId', ParseUUIDPipe) roomId: string) {
    return this.envService.getLatestForRoom(roomId);
  }

  /** Live simulated reading — not persisted */
  @Get('live')
  getLive(@Param('roomId', ParseUUIDPipe) roomId: string) {
    return this.envService.generateLive(roomId);
  }

  /** Generate and save N readings */
  @Post('generate')
  generate(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() dto: GenerateEnvReadingsDto,
  ) {
    return this.envService.generateAndSave(roomId, dto);
  }
}

/**
 * Global / cross-room environmental analytics
 * Base: /api/v1/env-readings
 */
@Controller('api/v1/env-readings')
export class EnvSensorReadingsGlobalController {
  constructor(private readonly envService: EnvSensorReadingsService) {}

  /**
   * GET /api/v1/env-readings/snapshot
   * Latest reading for every active room — useful for a dashboard heatmap.
   */
  @Get('snapshot')
  snapshot() {
    return this.envService.getLatestAllRooms();
  }

  /**
   * GET /api/v1/env-readings/occupied
   * All readings where PIR detected occupancy.
   */
  @Get('occupied')
  occupied(@Query() query: QueryEnvReadingsDto) {
    return this.envService.getOccupiedReadings(query);
  }

  /**
   * GET /api/v1/env-readings/high-co2?threshold=1000
   * Rooms where the latest CO2 reading exceeds threshold ppm.
   */
  @Get('high-co2')
  highCo2(@Query('threshold') threshold?: string) {
    return this.envService.getHighCo2Rooms(threshold ? +threshold : 1000);
  }
}
