import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import { config } from 'dotenv';

config();

const SENSOR_FILENAME_MAP = {
  co2: ['co2.csv', 'CO2.csv'],
  humidity: ['humidity.csv', 'Humidity.csv'],
  temperature: ['temperature.csv', 'temp.csv', 'Temp.csv'],
  light: ['light.csv', 'Light.csv'],
  pir: ['pir.csv', 'PIR.csv'],
};

function parseLine(line: string): { tsIso: string | null; val: number | null } {
  if (!line) return { tsIso: null, val: null };
  const parts = line.split(/,|;/).map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return { tsIso: null, val: null };
  const a = parts[0];
  const b = parts[1];
  // if a is epoch seconds
  if (/^\d{9,}$/.test(a) && !isNaN(parseFloat(b))) {
    return { tsIso: new Date(parseInt(a, 10) * 1000).toISOString(), val: parseFloat(b) };
  }
  // fallback: if b is epoch
  if (/^\d{9,}$/.test(b) && !isNaN(parseFloat(a))) {
    return { tsIso: new Date(parseInt(b, 10) * 1000).toISOString(), val: parseFloat(a) };
  }
  // fallback: try date parse on a
  const d = new Date(a);
  if (!isNaN(d.getTime()) && !isNaN(parseFloat(b))) return { tsIso: d.toISOString(), val: parseFloat(b) };
  return { tsIso: null, val: null };
}

async function main() {
  const args = process.argv.slice(2);
  const datasetDir = args[0];
  if (!datasetDir) {
    console.error('Usage: npx ts-node src/scripts/import-keti-simple.ts <dataset-dir>');
    process.exit(1);
  }

  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const { rows: roomRows } = await client.query('SELECT id, room_code FROM building.rooms');
  const roomMap = new Map(roomRows.map((r: any) => [r.room_code, r.id]));

  const entries = fs.readdirSync(datasetDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort();
  let total = 0;
  for (const roomCode of entries) {
    const roomId = roomMap.get(roomCode);
    if (!roomId) {
      console.warn('Room', roomCode, 'not in DB; skipping');
      continue;
    }
    const roomDir = path.join(datasetDir, roomCode);
    // load each sensor file lines
    const sensorData: Record<string, Map<string, number>> = {
      co2: new Map(), humidity: new Map(), temperature: new Map(), light: new Map(), pir: new Map()
    };
    for (const [key, names] of Object.entries(SENSOR_FILENAME_MAP)) {
      let found: string | null = null;
      for (const n of names) {
        const p = path.join(roomDir, n);
        if (fs.existsSync(p)) { found = p; break; }
      }
      if (!found) continue;
      const lines = fs.readFileSync(found, 'utf8').split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        // skip header if present (non-numeric first token)
        const firstTok = line.split(/,|;/)[0].trim();
        if (i === 0 && !/^\d/.test(firstTok) && isNaN(Date.parse(firstTok))) continue;
        const parsed = parseLine(line);
        if (parsed.tsIso && parsed.val !== null) sensorData[key].set(parsed.tsIso, parsed.val);
      }
    }

    // intersect timestamps across sensors (only insert rows where all sensors present)
    const tsSets = Object.values(sensorData).map(m => new Set([...m.keys()]));
    // compute intersection of non-empty maps only
    const nonEmptyMaps = Object.entries(sensorData).filter(([,m])=>m.size>0).map(([,m])=>m);
    if (nonEmptyMaps.length === 0) { console.warn('no sensor files for', roomCode); continue; }
    const allTimestamps = [...nonEmptyMaps[0].keys()];
    const common = allTimestamps.filter(ts => nonEmptyMaps.every(m => m.has(ts)));
    if (common.length === 0) { console.warn('no common timestamps for', roomCode); continue; }

    // bulk insert in chunks
    const CHUNK = 500;
    let insertedForRoom = 0;
    for (let i = 0; i < common.length; i += CHUNK) {
      const chunk = common.slice(i, i+CHUNK);
      const placeholders = chunk.map((_, idx) => {
        const b = idx*8;
        return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8})`;
      }).join(',');
      const params: any[] = [];
      for (const ts of chunk) {
        params.push(roomId, new Date(ts), sensorData.co2.get(ts)!, sensorData.humidity.get(ts)!, sensorData.temperature.get(ts)!, sensorData.light.get(ts)!, sensorData.pir.get(ts)!, sensorData.pir.get(ts)! > 0);
      }
      await client.query(`INSERT INTO building.env_sensor_readings (room_id, timestamp, co2_ppm, humidity_pct, temperature_c, luminosity_lux, pir_value, is_occupied) VALUES ${placeholders} ON CONFLICT DO NOTHING`, params);
      insertedForRoom += chunk.length;
    }
    total += insertedForRoom;
    console.log('Inserted', insertedForRoom, 'rows for room', roomCode);
  }

  console.log('Total inserted:', total);
  await client.end();
}

main().catch(e=>{console.error(e); process.exit(1);});
