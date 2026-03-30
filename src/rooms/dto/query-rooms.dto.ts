import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryRoomsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  floorNumber?: number;

  @IsOptional()
  @IsString()
  locationZone?: string;

  @IsOptional()
  @IsIn(['OFFICE', 'LAB', 'CONFERENCE', 'CORRIDOR', 'UTILITY'])
  roomType?: string;

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
