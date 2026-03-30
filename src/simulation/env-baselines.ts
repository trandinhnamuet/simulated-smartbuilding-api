/**
 * Baseline environmental statistics derived from the KETI Smart Building dataset
 * (Sutardja Dai Hall, UC Berkeley — 51 rooms, 4 floors).
 *
 * Each SensorRange captures the natural distribution observed in the data.
 * The simulation then adds time-of-day variation and Gaussian noise to reproduce
 * realistic, continuously-changing readings.
 */

export interface EnvSensorRange {
  mean: number;
  std: number;
  min: number;
  max: number;
}

export interface RoomTypeBaseline {
  /** Hourly multipliers (0–23h) for CO2, scaled around 1.0 */
  co2HourlyPattern: number[];
  /** Hourly multipliers for PIR occupancy probability */
  pirHourlyPattern: number[];
  /** Hourly multipliers for luminosity (lights follow occupancy) */
  luxHourlyPattern: number[];
  co2Ppm:       EnvSensorRange;
  humidityPct:  EnvSensorRange;
  temperatureC: EnvSensorRange;
  luminosityLux: EnvSensorRange;
  /** PIR non-zero probability */
  pirOccupancyRate: number;
  /** PIR value when occupied */
  pirActiveValue: EnvSensorRange;
}

/** Shared occupancy-hours pattern (weekday business-hours peak) */
const OFFICE_HOURLY_PIR = [
  0.0, 0.0, 0.0, 0.0, 0.0, 0.0,  // 0-5  AM — empty
  0.0, 0.1, 0.6, 1.0, 1.0, 1.0,  // 6-11 AM — ramp up
  0.9, 1.0, 1.0, 1.0, 0.9, 0.7,  // 12-17 — busy
  0.4, 0.2, 0.1, 0.0, 0.0, 0.0,  // 18-23 — wind down
];

const LAB_HOURLY_PIR = [
  0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
  0.0, 0.1, 0.4, 0.7, 0.8, 0.8,
  0.7, 0.8, 0.9, 0.9, 0.8, 0.8,
  0.7, 0.5, 0.3, 0.1, 0.0, 0.0,
];

const CONFERENCE_HOURLY_PIR = [
  0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
  0.0, 0.0, 0.2, 0.5, 0.8, 0.7,
  0.4, 0.7, 0.9, 0.6, 0.5, 0.2,
  0.1, 0.0, 0.0, 0.0, 0.0, 0.0,
];

/** CO2 follows occupancy pattern with lag */
function co2Pattern(pirPattern: number[]): number[] {
  return pirPattern.map((v) => 0.6 + v * 0.7);
}

/** Lux follows occupancy (lights on when people present) */
function luxPattern(pirPattern: number[]): number[] {
  return pirPattern.map((v) => (v > 0.05 ? 0.8 + v * 0.3 : 0.02));
}

export const ROOM_TYPE_BASELINES: Record<string, RoomTypeBaseline> = {
  OFFICE: {
    co2HourlyPattern:  co2Pattern(OFFICE_HOURLY_PIR),
    pirHourlyPattern:  OFFICE_HOURLY_PIR,
    luxHourlyPattern:  luxPattern(OFFICE_HOURLY_PIR),
    co2Ppm:        { mean: 650,  std: 180, min: 400,  max: 2500 },
    humidityPct:   { mean: 45,   std: 8,   min: 20,   max: 80   },
    temperatureC:  { mean: 22.5, std: 1.5, min: 18,   max: 28   },
    luminosityLux: { mean: 350,  std: 120, min: 0,    max: 1200 },
    pirOccupancyRate: 0.06,
    pirActiveValue:   { mean: 1.8, std: 0.6, min: 0.5, max: 5   },
  },

  LAB: {
    co2HourlyPattern:  co2Pattern(LAB_HOURLY_PIR),
    pirHourlyPattern:  LAB_HOURLY_PIR,
    luxHourlyPattern:  luxPattern(LAB_HOURLY_PIR),
    co2Ppm:        { mean: 700,  std: 200, min: 400,  max: 3000 },
    humidityPct:   { mean: 42,   std: 7,   min: 25,   max: 75   },
    temperatureC:  { mean: 21.5, std: 1.8, min: 17,   max: 28   },
    luminosityLux: { mean: 450,  std: 150, min: 0,    max: 1500 },
    pirOccupancyRate: 0.06,
    pirActiveValue:   { mean: 2.0, std: 0.8, min: 0.5, max: 6   },
  },

  CONFERENCE: {
    co2HourlyPattern:  co2Pattern(CONFERENCE_HOURLY_PIR),
    pirHourlyPattern:  CONFERENCE_HOURLY_PIR,
    luxHourlyPattern:  luxPattern(CONFERENCE_HOURLY_PIR),
    co2Ppm:        { mean: 800,  std: 300, min: 400,  max: 4000 },
    humidityPct:   { mean: 48,   std: 10,  min: 25,   max: 85   },
    temperatureC:  { mean: 22,   std: 2,   min: 18,   max: 30   },
    luminosityLux: { mean: 400,  std: 130, min: 0,    max: 1400 },
    pirOccupancyRate: 0.06,
    pirActiveValue:   { mean: 3.0, std: 1.0, min: 1.0, max: 8   },
  },

  CORRIDOR: {
    co2HourlyPattern:  co2Pattern(OFFICE_HOURLY_PIR),
    pirHourlyPattern:  OFFICE_HOURLY_PIR.map((v) => v * 0.4),
    luxHourlyPattern:  Array(24).fill(0.5),  // corridor lights on all day
    co2Ppm:        { mean: 500,  std: 80,  min: 400,  max: 900  },
    humidityPct:   { mean: 48,   std: 8,   min: 25,   max: 75   },
    temperatureC:  { mean: 21,   std: 2,   min: 16,   max: 28   },
    luminosityLux: { mean: 200,  std: 60,  min: 50,   max: 600  },
    pirOccupancyRate: 0.02,
    pirActiveValue:   { mean: 0.8, std: 0.3, min: 0.3, max: 2   },
  },

  UTILITY: {
    co2HourlyPattern:  Array(24).fill(0.7),
    pirHourlyPattern:  Array(24).fill(0.05),
    luxHourlyPattern:  Array(24).fill(0.1),
    co2Ppm:        { mean: 480,  std: 60,  min: 400,  max: 800  },
    humidityPct:   { mean: 55,   std: 12,  min: 30,   max: 85   },
    temperatureC:  { mean: 20,   std: 3,   min: 14,   max: 30   },
    luminosityLux: { mean: 80,   std: 40,  min: 0,    max: 300  },
    pirOccupancyRate: 0.01,
    pirActiveValue:   { mean: 0.5, std: 0.2, min: 0.2, max: 1.5 },
  },
};
