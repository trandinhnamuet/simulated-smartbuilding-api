/**
 * Script: import-keti-csv.ts
 *
 * Import dữ liệu cảm biến môi trường từ bộ dữ liệu KETI Smart Building (Kaggle)
 * vào bảng building.env_sensor_readings.
 *
 * Cấu trúc thư mục dataset:
 *   <dataset-dir>/
 *     413/
 *       CO2.csv        (cột: date, co2)
 *       Humidity.csv   (cột: date, humidity)
 *       Temp.csv       (cột: date, temp)
 *       Light.csv      (cột: date, light)
 *       PIR.csv        (cột: date, pir)
 *     415/
 *       ...
 *
 * Sử dụng:
 *   npx ts-node -r tsconfig-paths/register src/scripts/import-keti-csv.ts <path-to-dataset>
 *   npx ts-node -r tsconfig-paths/register src/scripts/import-keti-csv.ts <path-to-dataset> --limit 5000
 *
 * Tải dataset tại:
 *   https://www.kaggle.com/datasets/ranakrc/smart-building-system
 */

import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { Client } from 'pg';
import { config } from 'dotenv';

config();

// ─── CSV file mapping ─────────────────────────────────────────────────────────
// Danh sách tên file khả dĩ trong bộ dữ liệu (case-insensitive).
// Mỗi entry có một mảng tên file thử theo thứ tự ưu tiên.
const SENSOR_FILES = [
  { names: ['CO2.csv', 'co2.csv'],       dbCol: 'co2_ppm' },
  { names: ['Humidity.csv', 'humidity.csv'],  dbCol: 'humidity_pct' },
  { names: ['Temp.csv', 'temp.csv', 'temperature.csv'],      dbCol: 'temperature_c' },
  { names: ['Light.csv', 'light.csv'],     dbCol: 'luminosity_lux' },
  { names: ['PIR.csv', 'pir.csv'],       dbCol: 'pir_value' },
] as const;

// ─── CSV reader ───────────────────────────────────────────────────────────────
async function readCsvToMap(filePath: string): Promise<Map<string, number>> {
  const map = new Map<string, number>();

  if (!fs.existsSync(filePath)) {
    return map;
  }

  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let isHeader = true;
  for await (const lineRaw of rl) {
    const line = lineRaw.trim();
    if (!line) continue;
    if (isHeader) {
      isHeader = false;
      // Many files in this dataset don't have a header — skipping first line
      // may drop one data row but keeps logic simple. If first row looks like
      // data (numeric epoch), we still handle subsequent rows.
      continue; // bỏ qua header
    }

    // Primary pattern observed in KETI dataset: <epoch_seconds>, <value>
    const parts = line.split(/,|;/).map((s) => s.trim());
    if (parts.length < 2) continue;

    const first = parts[0];
    const second = parts[1];
    // If first is epoch seconds and second is numeric value — fast path
    if (/^\d{9,}$/.test(first) && !isNaN(parseFloat(second))) {
      const tsNormalized = new Date(parseInt(first, 10) * 1000).toISOString();
      const val = parseFloat(second);
      map.set(tsNormalized, val);
      continue;
    }

    // Fallback: try to detect timestamp and numeric value in any column
    let ts: string | null = null;
    for (let i = 0; i < parts.length; i++) {
      const cand = parts[i];
      if (/^\d{9,}$/.test(cand)) {
        ts = cand;
        break;
      }
      const d = new Date(cand);
      if (!isNaN(d.getTime())) {
        ts = cand;
        break;
      }
    }
    if (!ts) continue;

    // Normalize
    let tsNormalized = ts;
    if (/^\d{9,}$/.test(ts)) tsNormalized = new Date(parseInt(ts, 10) * 1000).toISOString();
    else {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) tsNormalized = d.toISOString();
    }

    let val: number | null = null;
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i] === ts) continue;
      const v = parseFloat(parts[i]);
      if (!isNaN(v)) {
        val = v;
        break;
      }
    }
    if (val === null) continue;
    map.set(tsNormalized, val);
  }

  return map;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  // Parse arguments
  const args = process.argv.slice(2);
  const datasetDir = args[0];

  if (!datasetDir || datasetDir.startsWith('--')) {
    console.error('❌ Thiếu đường dẫn dataset!');
    console.error('');
    console.error('Cách dùng:');
    console.error('  npx ts-node -r tsconfig-paths/register src/scripts/import-keti-csv.ts <path-to-dataset>');
    console.error('  npx ts-node -r tsconfig-paths/register src/scripts/import-keti-csv.ts <path-to-dataset> --limit 5000');
    console.error('');
    console.error('Ví dụ:');
    console.error('  npx ts-node -r tsconfig-paths/register src/scripts/import-keti-csv.ts C:\\Downloads\\keti-smart-building');
    process.exit(1);
  }

  if (!fs.existsSync(datasetDir)) {
    console.error(`❌ Không tìm thấy thư mục: ${datasetDir}`);
    process.exit(1);
  }

  // Tùy chọn --limit <N>: giới hạn số dòng mỗi phòng (mặc định không giới hạn)
  const limitIdx = args.indexOf('--limit');
  const maxRowsPerRoom = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;
  if (limitIdx >= 0) {
    console.log(`ℹ️  Giới hạn ${maxRowsPerRoom.toLocaleString()} dòng mỗi phòng`);
  }

  // Kết nối database
  const client = new Client({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT ?? '5432', 10),
    user:     process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Đã kết nối database\n');

  // Kiểm tra nếu đã có dữ liệu
  const { rows: existingRows } = await client.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM building.env_sensor_readings',
  );
  const existingCount = parseInt(existingRows[0].count, 10);
  if (existingCount > 0) {
    console.log(`ℹ️  env_sensor_readings đã có ${existingCount.toLocaleString()} dòng.`);
    console.log('   Thêm flag --force để import tiếp (sẽ bỏ qua trùng lặp).');
    if (!args.includes('--force')) {
      await client.end();
      return;
    }
  }

  // Lấy mapping room_code → UUID từ DB
  const { rows: roomRows } = await client.query<{ id: string; room_code: string }>(
    'SELECT id, room_code FROM building.rooms',
  );
  const roomMap = new Map<string, string>(); // roomCode → UUID
  for (const row of roomRows) {
    roomMap.set(row.room_code, row.id);
  }
  console.log(`📋 Tìm thấy ${roomMap.size} phòng trong database`);

  // Liệt kê các thư mục phòng trong dataset
  const entries = fs.readdirSync(datasetDir, { withFileTypes: true });
  const roomFolders = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  console.log(`📁 Tìm thấy ${roomFolders.length} thư mục phòng trong dataset`);
  console.log(`   ${roomFolders.join(', ')}\n`);

  let totalInserted = 0;
  let roomsProcessed = 0;
  const CHUNK_SIZE = 500;

  for (const roomCode of roomFolders) {
    const roomId = roomMap.get(roomCode);
    if (!roomId) {
      console.warn(`⚠️  Phòng "${roomCode}" không có trong DB — bỏ qua`);
      continue;
    }

    const roomDir = path.join(datasetDir, roomCode);

    // Đọc 5 file CSV: tìm tên file phù hợp trong mỗi entry của SENSOR_FILES
    const maps: Map<string, number>[] = [];
    const missingFiles: string[] = [];
    for (const sensor of SENSOR_FILES) {
      let foundMap: Map<string, number> | null = null;
      for (const candidate of sensor.names) {
        const p = path.join(roomDir, candidate);
        if (fs.existsSync(p)) {
          foundMap = await readCsvToMap(p);
          break;
        }
      }
      if (!foundMap) {
        maps.push(new Map());
        missingFiles.push(sensor.names.join('|'));
      } else {
        maps.push(foundMap);
      }
    }

    const [co2Map, humMap, tempMap, lightMap, pirMap] = maps;
    const fileSizes = [co2Map.size, humMap.size, tempMap.size, lightMap.size, pirMap.size];
    if (fileSizes.some((s) => s === 0)) {
      const missing = SENSOR_FILES
        .filter((_, i) => fileSizes[i] === 0)
        .map((s) => s.names.join('/'))
        .join(', ');
      console.warn(`⚠️  Phòng ${roomCode}: thiếu hoặc trống file ${missing} — bỏ qua`);
      continue;
    }

    // Inner join: chỉ giữ timestamp xuất hiện đủ ở cả 5 file
    let timestamps = [...co2Map.keys()].filter(
      (ts) => humMap.has(ts) && tempMap.has(ts) && lightMap.has(ts) && pirMap.has(ts),
    );

    if (timestamps.length === 0) {
      console.warn(`⚠️  Phòng ${roomCode}: không có timestamp chung giữa các file — bỏ qua`);
      continue;
    }

    // Sắp xếp theo thời gian và áp dụng giới hạn
    timestamps.sort();
    if (timestamps.length > maxRowsPerRoom) {
      timestamps = timestamps.slice(0, maxRowsPerRoom);
    }

    // Bulk insert theo từng chunk
    let roomInserted = 0;
    for (let i = 0; i < timestamps.length; i += CHUNK_SIZE) {
      const chunk = timestamps.slice(i, i + CHUNK_SIZE);

      // Tạo placeholder: mỗi hàng có 8 tham số
      const valuePlaceholders = chunk
        .map((_, idx) => {
          const b = idx * 8;
          return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8})`;
        })
        .join(', ');

      const params: (string | number | boolean | Date)[] = [];
      for (const ts of chunk) {
        const pirVal = pirMap.get(ts)!;
        params.push(
          roomId,           // $1 room_id
          new Date(ts),    // $2 timestamp
          co2Map.get(ts)!, // $3 co2_ppm
          humMap.get(ts)!, // $4 humidity_pct
          tempMap.get(ts)!,// $5 temperature_c
          lightMap.get(ts)!,// $6 luminosity_lux
          pirVal,          // $7 pir_value
          pirVal > 0,      // $8 is_occupied
        );
      }

      await client.query(
        `INSERT INTO building.env_sensor_readings
           (room_id, timestamp, co2_ppm, humidity_pct, temperature_c, luminosity_lux, pir_value, is_occupied)
         VALUES ${valuePlaceholders}
         ON CONFLICT DO NOTHING`,
        params,
      );

      roomInserted += chunk.length;
    }

    totalInserted += roomInserted;
    roomsProcessed++;

    // Hiển thị range ngày của dữ liệu
    const firstTs = timestamps[0];
    const lastTs = timestamps[timestamps.length - 1];
    console.log(
      `✅ Phòng ${roomCode.padEnd(8)}: ${roomInserted.toLocaleString().padStart(8)} dòng` +
      ` | ${firstTs.slice(0, 10)} → ${lastTs.slice(0, 10)}`,
    );
  }

  await client.end();

  console.log('\n' + '─'.repeat(60));
  console.log(`🎉 Import hoàn tất!`);
  console.log(`   Phòng đã xử lý : ${roomsProcessed} / ${roomFolders.length}`);
  console.log(`   Tổng dòng đã import: ${totalInserted.toLocaleString()}`);
}

main().catch((err: Error) => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
