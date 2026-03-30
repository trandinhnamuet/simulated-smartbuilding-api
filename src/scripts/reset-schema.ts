/**
 * Cleans up the old public-schema tables and migration records so the app can
 * re-apply the migration targeting the 'building' schema on next startup.
 *
 * Run once:  npx ts-node -r tsconfig-paths/register src/scripts/reset-schema.ts
 */
import 'reflect-metadata';
import { config } from 'dotenv';
import { Client } from 'pg';

config();

async function main() {
  const client = new Client({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT ?? '5432', 10),
    user:     process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to database.');

  try {
    // Drop old tables from public schema (order matters due to FK constraints)
    const dropPublic = [
      'DROP TABLE IF EXISTS public.maintenance_records CASCADE',
      'DROP TABLE IF EXISTS public.sensor_readings CASCADE',
      'DROP TABLE IF EXISTS public.machines CASCADE',
    ];
    for (const sql of dropPublic) {
      await client.query(sql);
      console.log(`✓ ${sql}`);
    }

    // Remove the old migration record from whatever table typeorm used
    const migrationTables = ['public.migrations', 'public.typeorm_migrations'];
    for (const t of migrationTables) {
      const { rowCount } = await client.query(
        `DELETE FROM ${t} WHERE name = 'InitialSchema1711111111111'`
      ).catch(() => ({ rowCount: 0 }));
      if (rowCount) console.log(`✓ Deleted migration record from ${t}`);
    }

    console.log('\nDone. Restart the app (npm start) to apply the migration in the "building" schema.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
