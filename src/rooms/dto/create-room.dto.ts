import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MaxLength(20)
  roomCode: string;

  @IsInt()
  @Min(1)
  @Max(20)
  floorNumber: number;

  @IsOptional()
  @IsString()
  locationZone?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  areaM2?: number;

  @IsOptional()
  @IsIn(['OFFICE', 'LAB', 'CONFERENCE', 'CORRIDOR', 'UTILITY'])
  roomType?: string;
}
