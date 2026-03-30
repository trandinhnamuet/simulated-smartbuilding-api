import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { QueryRoomsDto } from './dto/query-rooms.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomsRepo: Repository<Room>,
  ) {}

  async create(dto: CreateRoomDto): Promise<Room> {
    const exists = await this.roomsRepo.findOne({ where: { roomCode: dto.roomCode } });
    if (exists) throw new ConflictException(`Room code "${dto.roomCode}" already exists`);

    const room = this.roomsRepo.create({
      roomCode:     dto.roomCode,
      floorNumber:  dto.floorNumber,
      locationZone: dto.locationZone ?? null,
      areaM2:       dto.areaM2 ?? null,
      roomType:     dto.roomType ?? 'OFFICE',
    });
    return this.roomsRepo.save(room);
  }

  async findAll(query: QueryRoomsDto): Promise<{ data: Room[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, floorNumber, locationZone, roomType } = query;
    const where: FindOptionsWhere<Room> = {};
    if (floorNumber)   where.floorNumber  = floorNumber;
    if (locationZone)  where.locationZone = locationZone;
    if (roomType)      where.roomType     = roomType;

    const [data, total] = await this.roomsRepo.findAndCount({
      where,
      order: { floorNumber: 'ASC', roomCode: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomsRepo.findOne({ where: { id } });
    if (!room) throw new NotFoundException(`Room ${id} not found`);
    return room;
  }

  async findByCode(roomCode: string): Promise<Room> {
    const room = await this.roomsRepo.findOne({ where: { roomCode } });
    if (!room) throw new NotFoundException(`Room "${roomCode}" not found`);
    return room;
  }

  async count(): Promise<number> {
    return this.roomsRepo.count();
  }
}
