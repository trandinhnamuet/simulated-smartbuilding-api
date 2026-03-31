import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/v1/export/info.txt')
  exportInfoTxt(@Res() res: Response) {
    const content = [
      'Smart Building & Industrial IoT API',
      '====================================',
      `Generated: ${new Date().toISOString()}`,
      '',
      'Available API Groups:',
      '  - /api/v1/machines          : Industrial machines',
      '  - /api/v1/sensor-readings   : Machine sensor data',
      '  - /api/v1/maintenance-records: Maintenance history',
      '  - /api/v1/rooms             : Building rooms',
      '  - /api/v1/env-sensor-readings: Environmental sensors',
      '',
      'Docs: /api',
    ].join('\n');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="info.txt"');
    res.send(content);
  }
}
