/**
 * DataSource config used exclusively by the TypeORM CLI.
 * Usage:
 *   npx typeorm migration:generate -d src/config/typeorm.config.ts src/migrations/MigrationName
 *   npx typeorm migration:run     -d src/config/typeorm.config.ts
 *   npx typeorm migration:revert  -d src/config/typeorm.config.ts
 */
import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'path';

config(); // load .env

export default new DataSource({
  type: 'postgres',
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  entities:   [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: ['migration', 'error'],
});
