import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateEnvReadingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2000)
  count?: number = 1;

  /** Simulated interval between readings in seconds (default: 5s, same as dataset) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  intervalSec?: number = 5;
}
