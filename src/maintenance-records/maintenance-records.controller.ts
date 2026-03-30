import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { MaintenanceRecordsService } from './maintenance-records.service';
import { CreateMaintenanceRecordDto } from './dto/create-maintenance-record.dto';

@Controller('api/v1/machines/:machineId/maintenance')
export class MaintenanceRecordsController {
  constructor(
    private readonly maintenanceRecordsService: MaintenanceRecordsService,
  ) {}

  @Post()
  create(
    @Param('machineId', ParseUUIDPipe) machineId: string,
    @Body() dto: CreateMaintenanceRecordDto,
  ) {
    return this.maintenanceRecordsService.create(machineId, dto);
  }

  @Get()
  findAll(
    @Param('machineId', ParseUUIDPipe) machineId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.maintenanceRecordsService.findAllForMachine(
      machineId,
      +page,
      +limit,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.maintenanceRecordsService.findOne(id);
  }
}
