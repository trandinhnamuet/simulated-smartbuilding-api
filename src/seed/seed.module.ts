import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Machine } from '../machines/entities/machine.entity';
import { Room } from '../rooms/entities/room.entity';
import { SeedService } from './seed.service';
import { RoomSeedService } from './room-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Machine, Room])],
  providers: [SeedService, RoomSeedService],
})
export class SeedModule {}
