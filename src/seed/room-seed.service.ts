import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../rooms/entities/room.entity';

/**
 * Seed data derived from the KETI Smart Building dataset (Sutardja Dai Hall).
 * 51 rooms across 4 floors. Room codes match the folder names in the dataset.
 */
interface RoomSeed {
  roomCode: string;
  floorNumber: number;
  locationZone: string;
  areaM2: number;
  roomType: string;
}

const ROOM_SEEDS: RoomSeed[] = [
  // Floor 4 — 4xx series (labs + offices)
  { roomCode: '413',  floorNumber: 4, locationZone: 'Wing A', areaM2: 28,  roomType: 'OFFICE'     },
  { roomCode: '415',  floorNumber: 4, locationZone: 'Wing A', areaM2: 30,  roomType: 'OFFICE'     },
  { roomCode: '417',  floorNumber: 4, locationZone: 'Wing A', areaM2: 32,  roomType: 'LAB'        },
  { roomCode: '419',  floorNumber: 4, locationZone: 'Wing A', areaM2: 28,  roomType: 'LAB'        },
  { roomCode: '421',  floorNumber: 4, locationZone: 'Wing A', areaM2: 25,  roomType: 'OFFICE'     },
  { roomCode: '422',  floorNumber: 4, locationZone: 'Wing A', areaM2: 22,  roomType: 'UTILITY'    },
  { roomCode: '423',  floorNumber: 4, locationZone: 'Wing A', areaM2: 28,  roomType: 'OFFICE'     },
  { roomCode: '424',  floorNumber: 4, locationZone: 'Wing A', areaM2: 60,  roomType: 'CONFERENCE' },
  { roomCode: '442',  floorNumber: 4, locationZone: 'Wing B', areaM2: 35,  roomType: 'LAB'        },
  { roomCode: '446',  floorNumber: 4, locationZone: 'Wing B', areaM2: 38,  roomType: 'LAB'        },
  { roomCode: '448',  floorNumber: 4, locationZone: 'Wing B', areaM2: 30,  roomType: 'OFFICE'     },
  { roomCode: '452',  floorNumber: 4, locationZone: 'Wing B', areaM2: 32,  roomType: 'LAB'        },
  { roomCode: '454',  floorNumber: 4, locationZone: 'Wing B', areaM2: 28,  roomType: 'OFFICE'     },
  { roomCode: '456',  floorNumber: 4, locationZone: 'Wing B', areaM2: 30,  roomType: 'OFFICE'     },
  { roomCode: '458',  floorNumber: 4, locationZone: 'Wing B', areaM2: 35,  roomType: 'LAB'        },
  { roomCode: '462',  floorNumber: 4, locationZone: 'Wing B', areaM2: 80,  roomType: 'CONFERENCE' },

  // Floor 5 — 5xx series
  { roomCode: '510',  floorNumber: 5, locationZone: 'Wing A', areaM2: 25,  roomType: 'OFFICE'     },
  { roomCode: '511',  floorNumber: 5, locationZone: 'Wing A', areaM2: 25,  roomType: 'OFFICE'     },
  { roomCode: '513',  floorNumber: 5, locationZone: 'Wing A', areaM2: 30,  roomType: 'LAB'        },
  { roomCode: '552',  floorNumber: 5, locationZone: 'Wing B', areaM2: 28,  roomType: 'OFFICE'     },
  { roomCode: '554',  floorNumber: 5, locationZone: 'Wing B', areaM2: 30,  roomType: 'OFFICE'     },
  { roomCode: '556',  floorNumber: 5, locationZone: 'Wing B', areaM2: 28,  roomType: 'LAB'        },
  { roomCode: '558',  floorNumber: 5, locationZone: 'Wing B', areaM2: 32,  roomType: 'LAB'        },
  { roomCode: '562',  floorNumber: 5, locationZone: 'Wing B', areaM2: 70,  roomType: 'CONFERENCE' },
  { roomCode: '564',  floorNumber: 5, locationZone: 'Wing B', areaM2: 28,  roomType: 'OFFICE'     },

  // Floor 6 — 6xx series
  { roomCode: '621',  floorNumber: 6, locationZone: 'Wing A', areaM2: 35,  roomType: 'LAB'        },
  { roomCode: '621A', floorNumber: 6, locationZone: 'Wing A', areaM2: 18,  roomType: 'UTILITY'    },
  { roomCode: '621C', floorNumber: 6, locationZone: 'Wing A', areaM2: 20,  roomType: 'OFFICE'     },
  { roomCode: '621D', floorNumber: 6, locationZone: 'Wing A', areaM2: 20,  roomType: 'OFFICE'     },
  { roomCode: '621E', floorNumber: 6, locationZone: 'Wing A', areaM2: 22,  roomType: 'OFFICE'     },
  { roomCode: '623',  floorNumber: 6, locationZone: 'Wing A', areaM2: 28,  roomType: 'OFFICE'     },
  { roomCode: '625',  floorNumber: 6, locationZone: 'Wing A', areaM2: 30,  roomType: 'OFFICE'     },
  { roomCode: '627',  floorNumber: 6, locationZone: 'Wing A', areaM2: 32,  roomType: 'LAB'        },
  { roomCode: '629',  floorNumber: 6, locationZone: 'Wing A', areaM2: 35,  roomType: 'LAB'        },
  { roomCode: '642',  floorNumber: 6, locationZone: 'Wing B', areaM2: 28,  roomType: 'OFFICE'     },
  { roomCode: '644',  floorNumber: 6, locationZone: 'Wing B', areaM2: 28,  roomType: 'OFFICE'     },
  { roomCode: '646',  floorNumber: 6, locationZone: 'Wing B', areaM2: 30,  roomType: 'LAB'        },
  { roomCode: '648',  floorNumber: 6, locationZone: 'Wing B', areaM2: 30,  roomType: 'LAB'        },
  { roomCode: '652',  floorNumber: 6, locationZone: 'Wing B', areaM2: 28,  roomType: 'OFFICE'     },
  { roomCode: '654',  floorNumber: 6, locationZone: 'Wing B', areaM2: 28,  roomType: 'OFFICE'     },
  { roomCode: '656',  floorNumber: 6, locationZone: 'Wing B', areaM2: 30,  roomType: 'LAB'        },
  { roomCode: '662',  floorNumber: 6, locationZone: 'Wing B', areaM2: 75,  roomType: 'CONFERENCE' },
  { roomCode: '664',  floorNumber: 6, locationZone: 'Wing B', areaM2: 30,  roomType: 'OFFICE'     },

  // Floor 7 — 7xx series
  { roomCode: '712',  floorNumber: 7, locationZone: 'Wing A', areaM2: 25,  roomType: 'OFFICE'     },
  { roomCode: '714',  floorNumber: 7, locationZone: 'Wing A', areaM2: 25,  roomType: 'OFFICE'     },
  { roomCode: '716',  floorNumber: 7, locationZone: 'Wing A', areaM2: 30,  roomType: 'LAB'        },
  { roomCode: '718',  floorNumber: 7, locationZone: 'Wing A', areaM2: 30,  roomType: 'LAB'        },
  { roomCode: '752',  floorNumber: 7, locationZone: 'Wing B', areaM2: 28,  roomType: 'OFFICE'     },
  { roomCode: '754',  floorNumber: 7, locationZone: 'Wing B', areaM2: 28,  roomType: 'OFFICE'     },
  { roomCode: '756',  floorNumber: 7, locationZone: 'Wing B', areaM2: 30,  roomType: 'LAB'        },
  { roomCode: '762',  floorNumber: 7, locationZone: 'Wing B', areaM2: 70,  roomType: 'CONFERENCE' },
];

@Injectable()
export class RoomSeedService implements OnModuleInit {
  private readonly logger = new Logger(RoomSeedService.name);

  constructor(
    @InjectRepository(Room)
    private readonly roomsRepo: Repository<Room>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.roomsRepo.count();
    if (count > 0) {
      this.logger.log(`Room seed skipped — ${count} rooms already present`);
      return;
    }

    this.logger.log('Seeding database with KETI building rooms…');
    const entities = ROOM_SEEDS.map((s) => this.roomsRepo.create(s));
    await this.roomsRepo.save(entities);
    this.logger.log(`Seeded ${entities.length} rooms successfully`);
  }
}
