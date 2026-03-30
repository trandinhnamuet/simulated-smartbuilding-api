import { MigrationInterface, QueryRunner } from 'typeorm';

export class RoomsEnvSchema1711111111112 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------ rooms
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "building"."rooms" (
        "id"             UUID          NOT NULL DEFAULT gen_random_uuid(),
        "room_code"      VARCHAR(20)   NOT NULL,
        "floor_number"   INTEGER       NOT NULL,
        "location_zone"  VARCHAR(50)   NOT NULL,
        "area_m2"        NUMERIC(8,2)  NOT NULL DEFAULT 0,
        "room_type"      VARCHAR(20)   NOT NULL DEFAULT 'OFFICE',
        "is_active"      BOOLEAN       NOT NULL DEFAULT TRUE,
        "created_at"     TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"     TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rooms" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_rooms_room_code" UNIQUE ("room_code")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_rooms_floor"
        ON "building"."rooms" ("floor_number")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_rooms_type"
        ON "building"."rooms" ("room_type")
    `);

    // -------------------------------------------------- env_sensor_readings
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "building"."env_sensor_readings" (
        "id"              UUID          NOT NULL DEFAULT gen_random_uuid(),
        "room_id"         UUID          NOT NULL,
        "timestamp"       TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "co2_ppm"         NUMERIC(8,2),
        "humidity_pct"    NUMERIC(5,2),
        "temperature_c"   NUMERIC(5,2),
        "luminosity_lux"  NUMERIC(10,2),
        "pir_value"       NUMERIC(8,4)  NOT NULL DEFAULT 0,
        "is_occupied"     BOOLEAN       NOT NULL DEFAULT FALSE,
        "created_at"      TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_env_sensor_readings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_esr_room"
          FOREIGN KEY ("room_id") REFERENCES "building"."rooms"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_esr_room_timestamp"
        ON "building"."env_sensor_readings" ("room_id", "timestamp" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_esr_timestamp"
        ON "building"."env_sensor_readings" ("timestamp" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_esr_occupied"
        ON "building"."env_sensor_readings" ("is_occupied")
        WHERE "is_occupied" = TRUE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "building"."env_sensor_readings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "building"."rooms"`);
  }
}
