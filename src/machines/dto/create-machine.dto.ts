import { IsEnum, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';
import { MachineType } from '../../common/enums/machine-type.enum';

export class CreateMachineDto {
  @IsString()
  machineCode: string;

  @IsEnum(MachineType)
  machineType: MachineType;

  @IsString()
  locationZone: string;

  @IsInt()
  @Min(1)
  @Max(20)
  floorNumber: number;

  @IsISO8601()
  installDate: string;
}
