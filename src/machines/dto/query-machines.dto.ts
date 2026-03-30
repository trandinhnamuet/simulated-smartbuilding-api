import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MachineType } from '../../common/enums/machine-type.enum';

export class QueryMachinesDto {
  @IsOptional()
  @IsEnum(MachineType)
  machineType?: MachineType;

  @IsOptional()
  @IsString()
  locationZone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  floorNumber?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
