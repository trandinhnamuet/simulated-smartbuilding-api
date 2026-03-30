import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MaintenanceType } from '../../common/enums/maintenance-type.enum';

export class CreateMaintenanceRecordDto {
  @IsEnum(MaintenanceType)
  maintenanceType: MaintenanceType;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDateString()
  performedAt: string;

  @IsString()
  @MaxLength(100)
  performedBy: string;

  @IsOptional()
  @IsDateString()
  nextScheduledDate?: string;

  @IsOptional()
  failureFixed?: boolean;
}
