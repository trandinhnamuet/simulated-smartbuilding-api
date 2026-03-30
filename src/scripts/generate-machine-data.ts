/**
 * Script: generate-machine-data.ts
 *
 * Sinh dữ liệu giả lập cho:
 *   - building.sensor_readings   : 8.640 readings/máy (30 ngày × 5 phút 1 lần)
 *   - building.maintenance_records: 3–6 record/máy (trải đều trong 2 năm)
 *
 * Logic mô phỏng giống hệt SimulationService (Gaussian noise + mean-reversion).
 *
 * Sử dụng:
 *   npx ts-node -r tsconfig-paths/register src/scripts/generate-machine-data.ts
 *
 *   # Chỉ generate sensor_readings:
 *   npx ts-node -r tsconfig-paths/register src/scripts/generate-machine-data.ts --only readings
 *
 *   # Chỉ generate maintenance_records:
 *   npx ts-node -r tsconfig-paths/register src/scripts/generate-machine-data.ts --only maintenance
 */

import 'reflect-metadata';
import * as path from 'path';
import { Client } from 'pg';
import { config } from 'dotenv';

// Import baselines thuần TypeScript (không có NestJS decorator)
import { MACHINE_BASELINES, MachineBaseline, SensorRange } from '../simulation/machine-baselines';
import { MachineType } from '../common/enums/machine-type.enum';
import { MaintenanceType } from '../common/enums/maintenance-type.enum';

config();

// ─── Simulation helpers (replicate SimulationService logic) ──────────────────

function gaussianRandom(mean: number, std: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function sampleValue(range: SensorRange, previous?: number): number {
  const base = previous ?? range.mean;
  const noise = gaussianRandom(0, range.std * 0.35);
  const reversion = (range.mean - base) * 0.15;
  const next = base + noise + reversion;
  return parseFloat(Math.max(range.min, Math.min(range.max, next)).toFixed(3));
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MachineRow {
  id: string;
  machine_type: MachineType;
  total_runtime_hours: number;
  total_cycle_count: number;
  remaining_useful_life_days: number;
}

interface SensorReadingRow {
  machine_id: string;
  timestamp: Date;
  temperature_c: number;
  vibration_ms2: number;
  sound_db: number;
  power_kw: number;
  oil_level_pct: number;
  coolant_level_pct: number | null;
  laser_intensity_w: number | null;
  hydraulic_pressure_bar: number | null;
  spindle_speed_rpm: number | null;
  tool_wear_mm: number | null;
  pressure_bar: number | null;
  flow_rate_l_min: number | null;
  runtime_hours: number;
  cycle_count: number;
  is_anomaly: boolean;
  remaining_useful_life_days: number;
  failure_within_7_days: boolean;
}

// ─── Generate one sensor reading ─────────────────────────────────────────────

function generateReading(
  machine: MachineRow,
  baseline: MachineBaseline,
  timestamp: Date,
  previous?: SensorReadingRow,
  intervalSec = 300,
): SensorReadingRow {
  const isAnomaly = Math.random() < 0.04; // ~4% anomaly rate
  const af = isAnomaly ? 1 + Math.random() * 0.4 : 1; // anomaly factor

  const temperatureC        = parseFloat((sampleValue(baseline.temperatureC, previous?.temperature_c) * af).toFixed(2));
  const vibrationMs2        = parseFloat((sampleValue(baseline.vibrationMs2, previous?.vibration_ms2) * af).toFixed(3));
  const soundDb             = parseFloat((sampleValue(baseline.soundDb, previous?.sound_db) * af).toFixed(2));
  const powerKw             = parseFloat((sampleValue(baseline.powerKw, previous?.power_kw) * af).toFixed(3));

  // Fluid levels: giảm dần, thỉnh thoảng refill
  const oilLevelPct = parseFloat(
    Math.max(5,
      (previous?.oil_level_pct ?? baseline.oilLevelPct.mean)
        - Math.random() * 0.05
        + (Math.random() < 0.02 ? 10 : 0),
    ).toFixed(2),
  );

  const coolantLevelPct = baseline.coolantLevelPct !== null
    ? parseFloat(
        Math.max(5,
          (previous?.coolant_level_pct ?? baseline.coolantLevelPct!.mean)
            - Math.random() * 0.04
            + (Math.random() < 0.02 ? 8 : 0),
        ).toFixed(2),
      )
    : null;

  // Sensor đặc thù từng loại máy
  const laserIntensityW = baseline.laserIntensityW
    ? parseFloat((sampleValue(baseline.laserIntensityW, previous?.laser_intensity_w ?? undefined) * af).toFixed(1))
    : null;

  const hydraulicPressureBar = baseline.hydraulicPressureBar
    ? parseFloat((sampleValue(baseline.hydraulicPressureBar, previous?.hydraulic_pressure_bar ?? undefined) * af).toFixed(2))
    : null;

  const spindleSpeedRpm = baseline.spindleSpeedRpm
    ? parseFloat(sampleValue(baseline.spindleSpeedRpm, previous?.spindle_speed_rpm ?? undefined).toFixed(0))
    : null;

  const ratePerCycle = baseline.toolWearRatePerCycle ?? 0.0002;
  const toolWearMm = baseline.toolWearMm
    ? parseFloat(
        Math.min(
          baseline.toolWearMm.max,
          machine.total_cycle_count * ratePerCycle + gaussianRandom(0, 0.05),
        ).toFixed(3),
      )
    : null;

  const pressureBar = baseline.pressureBar
    ? parseFloat((sampleValue(baseline.pressureBar, previous?.pressure_bar ?? undefined) * af).toFixed(2))
    : null;

  const flowRateLMin = baseline.flowRateLMin
    ? parseFloat((sampleValue(baseline.flowRateLMin, previous?.flow_rate_l_min ?? undefined) * af).toFixed(2))
    : null;

  // Runtime & lifecycle
  const runtimeHours = parseFloat(
    ((previous?.runtime_hours ?? machine.total_runtime_hours) + intervalSec / 3600).toFixed(4),
  );
  const cycleCount = (previous?.cycle_count ?? machine.total_cycle_count) + Math.floor(Math.random() * 3);
  const rul = Math.max(
    0,
    (previous?.remaining_useful_life_days ?? machine.remaining_useful_life_days)
      - intervalSec / 3600 / 24,
  );
  const remainingUsefulLifeDays = parseFloat(rul.toFixed(2));
  const failureWithin7Days = remainingUsefulLifeDays < 7;

  return {
    machine_id: machine.id,
    timestamp,
    temperature_c:          temperatureC,
    vibration_ms2:          vibrationMs2,
    sound_db:               soundDb,
    power_kw:               powerKw,
    oil_level_pct:          oilLevelPct,
    coolant_level_pct:      coolantLevelPct,
    laser_intensity_w:      laserIntensityW,
    hydraulic_pressure_bar: hydraulicPressureBar,
    spindle_speed_rpm:      spindleSpeedRpm,
    tool_wear_mm:           toolWearMm,
    pressure_bar:           pressureBar,
    flow_rate_l_min:        flowRateLMin,
    runtime_hours:          runtimeHours,
    cycle_count:            cycleCount,
    is_anomaly:             isAnomaly,
    remaining_useful_life_days: remainingUsefulLifeDays,
    failure_within_7_days:  failureWithin7Days,
  };
}

// ─── Maintenance templates ────────────────────────────────────────────────────

const TECHNICIANS = [
  'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường', 'Phạm Thị Dung',
  'Hoàng Văn Em', 'Đỗ Thị Phúc', 'Vũ Minh Giang', 'Bùi Thị Hoa',
];

const MAINTENANCE_NOTES: Record<MaintenanceType, string[]> = {
  [MaintenanceType.ROUTINE]: [
    'Kiểm định định kỳ hoàn tất. Các thông số trong ngưỡng bình thường.',
    'Bôi trơn và thay bộ lọc định kỳ.',
    'Hiệu chỉnh và kiểm tra đã đạt. Không phát hiện vấn đề.',
    'Bảo dưỡng hàng tháng theo lịch.',
    'Vệ sinh, kiểm tra điện và thay dầu nhớt.',
  ],
  [MaintenanceType.CORRECTIVE]: [
    'Cảm biến lỗi đã được thay thế. Máy đã trở lại hoạt động.',
    'Phát hiện quá nhiệt — sửa hệ thống làm mát.',
    'Độ rung bất thường do vòng bi mòn. Đã thay vòng bi.',
    'Phát hiện rò rỉ thủy lực. Đã vá và bổ sung dầu.',
    'Xác định lỗi điện và sửa xong.',
  ],
  [MaintenanceType.PREDICTIVE]: [
    'Phân tích xu hướng rung phát hiện mòn vòng bi. Thay thế phòng ngừa.',
    'Phân tích dầu phát hiện nhiễm bẩn. Đã thay dầu.',
    'Ảnh nhiệt xác định điểm nóng — đã thay linh kiện.',
    'Xử lý cảnh báo dự đoán trước khi sự cố xảy ra.',
  ],
};

// ─── Insert helpers ───────────────────────────────────────────────────────────

async function insertSensorReadings(client: Client, machines: MachineRow[]): Promise<void> {
  const DAYS = 30;
  const INTERVAL_SEC = 300; // 5 phút
  const READINGS_PER_MACHINE = Math.floor((DAYS * 24 * 60 * 60) / INTERVAL_SEC); // 8640
  const CHUNK_SIZE = 500;

  const now = new Date();
  const startTime = new Date(now.getTime() - DAYS * 24 * 60 * 60 * 1000);

  let totalInserted = 0;

  console.log(`\n[1/2] Generating sensor_readings — ${READINGS_PER_MACHINE.toLocaleString()} dòng/máy × ${machines.length} máy`);
  console.log(`      Khoảng thời gian: ${startTime.toISOString().slice(0, 10)} → ${now.toISOString().slice(0, 10)}\n`);

  for (const machine of machines) {
    const baseline = MACHINE_BASELINES[machine.machine_type];
    if (!baseline) {
      console.warn(`⚠️  Loại máy "${machine.machine_type}" không có baseline — bỏ qua`);
      continue;
    }

    // Kiểm tra máy này đã có đủ data chưa (để có thể resume an toàn)
    const { rows: machineCheck } = await client.query<{ cnt: string }>(
      'SELECT COUNT(*)::text AS cnt FROM building.sensor_readings WHERE machine_id = $1',
      [machine.id],
    );
    const existingForMachine = parseInt(machineCheck[0].cnt, 10);
    if (existingForMachine >= READINGS_PER_MACHINE) {
      console.log(
        `  ⏭  ${machine.machine_type.padEnd(20)} (${machine.id.slice(0, 8)}…): đã có đủ ${existingForMachine.toLocaleString()} readings — bỏ qua`,
      );
      continue;
    }
    if (existingForMachine > 0) {
      console.log(
        `  ♻️  ${machine.machine_type.padEnd(20)} (${machine.id.slice(0, 8)}…): có ${existingForMachine} rows cũ — xóa và sinh lại`,
      );
      await client.query('DELETE FROM building.sensor_readings WHERE machine_id = $1', [machine.id]);
    }

    // Sinh toàn bộ readings cho máy
    let previous: SensorReadingRow | undefined;
    const batch: SensorReadingRow[] = [];

    for (let i = 0; i < READINGS_PER_MACHINE; i++) {
      const timestamp = new Date(startTime.getTime() + i * INTERVAL_SEC * 1000);
      const reading = generateReading(machine, baseline, timestamp, previous, INTERVAL_SEC);
      batch.push(reading);
      previous = reading;
    }

    // Insert theo chunk
    for (let i = 0; i < batch.length; i += CHUNK_SIZE) {
      const chunk = batch.slice(i, i + CHUNK_SIZE);

      const valuePlaceholders = chunk
        .map((_, idx) => {
          const b = idx * 19;
          return [
            `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7}`,
            `$${b+8},$${b+9},$${b+10},$${b+11},$${b+12},$${b+13},$${b+14}`,
            `$${b+15},$${b+16},$${b+17},$${b+18},$${b+19})`,
          ].join(',');
        })
        .join(', ');

      const params: unknown[] = [];
      for (const r of chunk) {
        params.push(
          r.machine_id,
          r.timestamp,
          r.temperature_c,
          r.vibration_ms2,
          r.sound_db,
          r.power_kw,
          r.oil_level_pct,
          r.coolant_level_pct,
          r.laser_intensity_w,
          r.hydraulic_pressure_bar,
          r.spindle_speed_rpm,
          r.tool_wear_mm,
          r.pressure_bar,
          r.flow_rate_l_min,
          r.runtime_hours,
          r.cycle_count,
          r.is_anomaly,
          r.remaining_useful_life_days,
          r.failure_within_7_days,
        );
      }

      await client.query(
        `INSERT INTO building.sensor_readings
           (machine_id, timestamp,
            temperature_c, vibration_ms2, sound_db, power_kw,
            oil_level_pct, coolant_level_pct,
            laser_intensity_w, hydraulic_pressure_bar,
            spindle_speed_rpm, tool_wear_mm,
            pressure_bar, flow_rate_l_min,
            runtime_hours, cycle_count,
            is_anomaly, remaining_useful_life_days, failure_within_7_days)
         VALUES ${valuePlaceholders}`,
        params,
      );

      totalInserted += chunk.length;
    }

    console.log(
      `  ✅ ${machine.machine_type.padEnd(20)} (${machine.id.slice(0, 8)}…): ${READINGS_PER_MACHINE.toLocaleString()} readings`,
    );
  }

  console.log(`\n  📊 Tổng sensor_readings đã insert: ${totalInserted.toLocaleString()}`);
}

async function insertMaintenanceRecords(client: Client, machines: MachineRow[]): Promise<void> {
  const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;
  const now = new Date();
  let totalInserted = 0;

  console.log('\n[2/2] Generating maintenance_records — 3–6 record/máy\n');

  for (const machine of machines) {
    const recordCount = 3 + Math.floor(Math.random() * 4); // 3–6

    for (let j = 0; j < recordCount; j++) {
      // Phân bổ loại bảo dưỡng: 50% ROUTINE, 30% CORRECTIVE, 20% PREDICTIVE
      const rand = Math.random();
      const type: MaintenanceType =
        rand < 0.5 ? MaintenanceType.ROUTINE
        : rand < 0.8 ? MaintenanceType.CORRECTIVE
        : MaintenanceType.PREDICTIVE;

      const performedAt = new Date(now.getTime() - Math.random() * TWO_YEARS_MS);
      const nextScheduledDate = new Date(performedAt.getTime() + 90 * 24 * 60 * 60 * 1000);
      const notesList = MAINTENANCE_NOTES[type];
      const notes = notesList[Math.floor(Math.random() * notesList.length)];
      const performedBy = TECHNICIANS[Math.floor(Math.random() * TECHNICIANS.length)];
      const failureFixed = type === MaintenanceType.CORRECTIVE && Math.random() > 0.2;

      await client.query(
        `INSERT INTO building.maintenance_records
           (machine_id, maintenance_type, notes, performed_at, performed_by, next_scheduled_date, failure_fixed)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          machine.id,
          type,
          notes,
          performedAt,
          performedBy,
          nextScheduledDate.toISOString().slice(0, 10),
          failureFixed,
        ],
      );

      totalInserted++;
    }

    console.log(
      `  ✅ ${machine.machine_type.padEnd(20)} (${machine.id.slice(0, 8)}…): ${recordCount} maintenance records`,
    );
  }

  console.log(`\n  📊 Tổng maintenance_records đã insert: ${totalInserted}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const onlyIdx = args.indexOf('--only');
  const onlyMode = onlyIdx >= 0 ? args[onlyIdx + 1] : 'all'; // 'readings' | 'maintenance' | 'all'

  const client = new Client({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT ?? '5432', 10),
    user:     process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Đã kết nối database');

  // Kiểm tra dữ liệu hiện có
  if (onlyMode === 'all' || onlyMode === 'readings') {
    const { rows } = await client.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM building.sensor_readings',
    );
    const count = parseInt(rows[0].count, 10);
    if (count > 0 && !args.includes('--force')) {
      console.log(`ℹ️  sensor_readings đã có ${count.toLocaleString()} dòng — bỏ qua phần này.`);
      console.log('   Dùng --force để ghi đè (xóa dữ liệu cũ trước).');
    }
  }

  if (onlyMode === 'all' || onlyMode === 'maintenance') {
    const { rows } = await client.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM building.maintenance_records',
    );
    const count = parseInt(rows[0].count, 10);
    if (count > 0 && !args.includes('--force')) {
      console.log(`ℹ️  maintenance_records đã có ${count} dòng — bỏ qua phần này.`);
      console.log('   Dùng --force để ghi đè (xóa dữ liệu cũ trước).');
    }
  }

  // Lấy danh sách machines
  const { rows: machines } = await client.query<MachineRow>(
    `SELECT id, machine_type, total_runtime_hours, total_cycle_count, remaining_useful_life_days
     FROM building.machines
     WHERE is_active = true
     ORDER BY machine_type`,
  );

  if (machines.length === 0) {
    console.error('❌ Không có máy nào trong database. Hãy chạy ứng dụng một lần để seed máy.');
    await client.end();
    process.exit(1);
  }

  console.log(`📋 Tìm thấy ${machines.length} máy đang hoạt động\n`);

  // Kiểm tra số dòng hiện tại lần nữa trước khi insert
  const { rows: srCount } = await client.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM building.sensor_readings',
  );
  const { rows: mrCount } = await client.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM building.maintenance_records',
  );

  const shouldGenReadings  = (onlyMode === 'all' || onlyMode === 'readings');
  const shouldGenMaint     = (onlyMode === 'all' || onlyMode === 'maintenance')
    && (parseInt(mrCount[0].count, 10) === 0 || args.includes('--force'));

  if (shouldGenReadings) {
    await insertSensorReadings(client, machines);
  }

  if (shouldGenMaint) {
    await insertMaintenanceRecords(client, machines);
  }

  if (!shouldGenReadings && !shouldGenMaint) {
    console.log('\nℹ️  Không có gì để insert. Maintenance records đã có dữ liệu.');
    console.log('   Dùng --force nếu muốn ghi đè maintenance (nhớ truncate bảng trước).');
  }

  await client.end();
  console.log('\n🎉 Hoàn tất!');
}

main().catch((err: Error) => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
