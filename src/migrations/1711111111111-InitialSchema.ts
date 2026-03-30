import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1711111111111 implements MigrationInterface {
  name = 'InitialSchema1711111111111';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Schema ────────────────────────────────────────────────────────────
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "building"`);

    // ── Machines ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "building"."machines" (
        "id"                         uuid         NOT NULL DEFAULT gen_random_uuid(),
        "machine_code"               varchar(50)  NOT NULL,
        "machine_type"               varchar(50)  NOT NULL,
        "location_zone"              varchar(50)  NOT NULL,
        "floor_number"               integer      NOT NULL,
        "install_date"               date         NOT NULL,
        "is_active"                  boolean      NOT NULL DEFAULT true,
        "total_runtime_hours"        float        NOT NULL DEFAULT 0,
        "total_cycle_count"          integer      NOT NULL DEFAULT 0,
        "remaining_useful_life_days" float,
        "failure_within_7_days"      boolean      NOT NULL DEFAULT false,
        "created_at"                 timestamptz  NOT NULL DEFAULT now(),
        "updated_at"                 timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "pk_machines"              PRIMARY KEY ("id"),
        CONSTRAINT "uq_machines_machine_code" UNIQUE ("machine_code")
      )
    `);

    // ── Sensor Readings ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "building"."sensor_readings" (
        "id"                         uuid        NOT NULL DEFAULT gen_random_uuid(),
        "machine_id"                 uuid        NOT NULL,
        "timestamp"                  timestamptz NOT NULL,
        "temperature_c"              float       NOT NULL,
        "vibration_ms2"              float       NOT NULL,
        "sound_db"                   float       NOT NULL,
        "power_kw"                   float       NOT NULL,
        "oil_level_pct"              float       NOT NULL,
        "coolant_level_pct"          float,
        "laser_intensity_w"          float,
        "hydraulic_pressure_bar"     float,
        "spindle_speed_rpm"          float,
        "tool_wear_mm"               float,
        "pressure_bar"               float,
        "flow_rate_l_min"            float,
        "runtime_hours"              float       NOT NULL,
        "cycle_count"                integer     NOT NULL,
        "is_anomaly"                 boolean     NOT NULL DEFAULT false,
        "remaining_useful_life_days" float       NOT NULL,
        "failure_within_7_days"      boolean     NOT NULL DEFAULT false,
        "created_at"                 timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_sensor_readings" PRIMARY KEY ("id"),
        CONSTRAINT "fk_sensor_readings_machine"
          FOREIGN KEY ("machine_id") REFERENCES "building"."machines"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_sr_machine_timestamp"
        ON "building"."sensor_readings" ("machine_id", "timestamp" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_sr_timestamp"
        ON "building"."sensor_readings" ("timestamp" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_sr_anomaly"
        ON "building"."sensor_readings" ("is_anomaly")
        WHERE "is_anomaly" = true
    `);

    // ── Maintenance Records ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "building"."maintenance_records" (
        "id"                  uuid         NOT NULL DEFAULT gen_random_uuid(),
        "machine_id"          uuid         NOT NULL,
        "maintenance_type"    varchar(20)  NOT NULL,
        "notes"               text,
        "performed_at"        timestamptz  NOT NULL,
        "performed_by"        varchar(100) NOT NULL,
        "next_scheduled_date" date,
        "failure_fixed"       boolean      NOT NULL DEFAULT false,
        "created_at"          timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "pk_maintenance_records" PRIMARY KEY ("id"),
        CONSTRAINT "fk_maintenance_records_machine"
          FOREIGN KEY ("machine_id") REFERENCES "building"."machines"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_mr_machine_id"
        ON "building"."maintenance_records" ("machine_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "building"."idx_mr_machine_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "building"."maintenance_records"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "building"."idx_sr_anomaly"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "building"."idx_sr_timestamp"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "building"."idx_sr_machine_timestamp"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "building"."sensor_readings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "building"."machines"`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS "building"`);
  }
}
