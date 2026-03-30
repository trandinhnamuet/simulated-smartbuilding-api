import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateReadingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  count?: number = 1;

  /** Simulated interval between each reading in seconds */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  intervalSec?: number = 30;
}
