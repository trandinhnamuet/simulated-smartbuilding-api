import { MachineType } from '../common/enums/machine-type.enum';

export interface SensorRange {
  mean: number;
  std: number;
  min: number;
  max: number;
}

export interface MachineBaseline {
  temperatureC: SensorRange;
  vibrationMs2: SensorRange;
  soundDb: SensorRange;
  powerKw: SensorRange;
  oilLevelPct: SensorRange;
  coolantLevelPct: SensorRange | null;
  laserIntensityW?: SensorRange;
  hydraulicPressureBar?: SensorRange;
  spindleSpeedRpm?: SensorRange;
  toolWearMm?: SensorRange;
  pressureBar?: SensorRange;
  flowRateLMin?: SensorRange;
  /** Nominal useful life when installed fresh */
  nominalRulDays: number;
  /** Tool/wear drift rate (unit per 100 cycles) — increases tool_wear_mm */
  toolWearRatePerCycle?: number;
}

export const MACHINE_BASELINES: Record<MachineType, MachineBaseline> = {
  [MachineType.CNC_MILL]: {
    temperatureC:    { mean: 60,   std: 8,   min: 35,  max: 90  },
    vibrationMs2:    { mean: 3.5,  std: 1.2, min: 0.5, max: 9   },
    soundDb:         { mean: 78,   std: 5,   min: 62,  max: 92  },
    powerKw:         { mean: 16,   std: 4,   min: 5,   max: 30  },
    oilLevelPct:     { mean: 80,   std: 6,   min: 30,  max: 100 },
    coolantLevelPct: { mean: 78,   std: 7,   min: 25,  max: 100 },
    spindleSpeedRpm: { mean: 2500, std: 600, min: 400, max: 5000 },
    toolWearMm:      { mean: 4,    std: 2,   min: 0,   max: 20  },
    nominalRulDays:  365,
    toolWearRatePerCycle: 0.0002,
  },

  [MachineType.FURNACE]: {
    temperatureC:    { mean: 850,  std: 150, min: 300, max: 1250 },
    vibrationMs2:    { mean: 0.25, std: 0.1, min: 0.05, max: 0.8 },
    soundDb:         { mean: 62,   std: 4,   min: 50,  max: 75  },
    powerKw:         { mean: 160,  std: 40,  min: 60,  max: 280 },
    oilLevelPct:     { mean: 88,   std: 5,   min: 60,  max: 100 },
    coolantLevelPct: null,
    nominalRulDays:  730,
  },

  [MachineType.ROBOT_ARM]: {
    temperatureC:    { mean: 48,   std: 8,   min: 25,  max: 75  },
    vibrationMs2:    { mean: 6,    std: 2.5, min: 0.5, max: 15  },
    soundDb:         { mean: 70,   std: 5,   min: 55,  max: 86  },
    powerKw:         { mean: 5,    std: 1.5, min: 1,   max: 10  },
    oilLevelPct:     { mean: 82,   std: 6,   min: 40,  max: 100 },
    coolantLevelPct: null,
    nominalRulDays:  500,
  },

  [MachineType.LASER_CUTTER]: {
    temperatureC:    { mean: 38,   std: 5,   min: 20,  max: 60  },
    vibrationMs2:    { mean: 0.15, std: 0.08, min: 0.01, max: 0.6 },
    soundDb:         { mean: 80,   std: 4,   min: 68,  max: 92  },
    powerKw:         { mean: 9,    std: 3,   min: 2,   max: 18  },
    oilLevelPct:     { mean: 90,   std: 4,   min: 65,  max: 100 },
    coolantLevelPct: { mean: 82,   std: 6,   min: 50,  max: 100 },
    laserIntensityW: { mean: 4500, std: 1500, min: 100, max: 10000 },
    nominalRulDays:  400,
  },

  [MachineType.HYDRAULIC_PRESS]: {
    temperatureC:    { mean: 58,   std: 10,  min: 30,  max: 90  },
    vibrationMs2:    { mean: 9,    std: 3,   min: 1.5, max: 20  },
    soundDb:         { mean: 90,   std: 6,   min: 72,  max: 110 },
    powerKw:         { mean: 40,   std: 12,  min: 10,  max: 90  },
    oilLevelPct:     { mean: 78,   std: 7,   min: 30,  max: 100 },
    coolantLevelPct: null,
    hydraulicPressureBar: { mean: 175, std: 40, min: 30, max: 320 },
    nominalRulDays:  600,
  },

  [MachineType.COMPRESSOR]: {
    temperatureC:    { mean: 60,   std: 10,  min: 25,  max: 95  },
    vibrationMs2:    { mean: 4.5,  std: 1.5, min: 0.5, max: 10  },
    soundDb:         { mean: 84,   std: 6,   min: 68,  max: 100 },
    powerKw:         { mean: 25,   std: 8,   min: 5,   max: 55  },
    oilLevelPct:     { mean: 82,   std: 6,   min: 40,  max: 100 },
    coolantLevelPct: null,
    pressureBar:     { mean: 8,    std: 2,   min: 2,   max: 16  },
    nominalRulDays:  450,
  },

  [MachineType.CONVEYOR]: {
    temperatureC:    { mean: 38,   std: 6,   min: 20,  max: 65  },
    vibrationMs2:    { mean: 2.5,  std: 1,   min: 0.2, max: 7   },
    soundDb:         { mean: 68,   std: 5,   min: 52,  max: 85  },
    powerKw:         { mean: 7,    std: 2,   min: 1,   max: 15  },
    oilLevelPct:     { mean: 84,   std: 5,   min: 50,  max: 100 },
    coolantLevelPct: null,
    nominalRulDays:  700,
  },

  [MachineType.PUMP]: {
    temperatureC:    { mean: 52,   std: 8,   min: 25,  max: 80  },
    vibrationMs2:    { mean: 3,    std: 1.2, min: 0.3, max: 8   },
    soundDb:         { mean: 65,   std: 5,   min: 50,  max: 82  },
    powerKw:         { mean: 10,   std: 4,   min: 0.5, max: 25  },
    oilLevelPct:     { mean: 85,   std: 5,   min: 50,  max: 100 },
    coolantLevelPct: null,
    pressureBar:     { mean: 18,   std: 8,   min: 0.5, max: 60  },
    flowRateLMin:    { mean: 50,   std: 20,  min: 2,   max: 120 },
    nominalRulDays:  550,
  },

  [MachineType.TURBINE]: {
    temperatureC:    { mean: 380,  std: 80,  min: 80,  max: 650 },
    vibrationMs2:    { mean: 4,    std: 1.5, min: 0.5, max: 10  },
    soundDb:         { mean: 95,   std: 6,   min: 78,  max: 115 },
    powerKw:         { mean: 280,  std: 80,  min: 80,  max: 550 },
    oilLevelPct:     { mean: 80,   std: 6,   min: 45,  max: 100 },
    coolantLevelPct: { mean: 75,   std: 8,   min: 40,  max: 100 },
    nominalRulDays:  800,
  },

  [MachineType.WELDER]: {
    temperatureC:    { mean: 320,  std: 60,  min: 100, max: 500 },
    vibrationMs2:    { mean: 1.5,  std: 0.7, min: 0.2, max: 5   },
    soundDb:         { mean: 72,   std: 5,   min: 58,  max: 88  },
    powerKw:         { mean: 20,   std: 8,   min: 3,   max: 50  },
    oilLevelPct:     { mean: 85,   std: 5,   min: 55,  max: 100 },
    coolantLevelPct: null,
    nominalRulDays:  300,
  },

  [MachineType.THREE_D_PRINTER]: {
    temperatureC:    { mean: 230,  std: 20,  min: 170, max: 290 },
    vibrationMs2:    { mean: 0.4,  std: 0.15, min: 0.05, max: 1.2 },
    soundDb:         { mean: 52,   std: 4,   min: 40,  max: 68  },
    powerKw:         { mean: 1.5,  std: 0.5, min: 0.3, max: 4   },
    oilLevelPct:     { mean: 92,   std: 4,   min: 70,  max: 100 },
    coolantLevelPct: null,
    nominalRulDays:  250,
  },

  [MachineType.INJECTION_MOLD]: {
    temperatureC:    { mean: 250,  std: 40,  min: 120, max: 380 },
    vibrationMs2:    { mean: 5,    std: 2,   min: 0.5, max: 12  },
    soundDb:         { mean: 82,   std: 5,   min: 65,  max: 98  },
    powerKw:         { mean: 55,   std: 18,  min: 15,  max: 120 },
    oilLevelPct:     { mean: 78,   std: 7,   min: 35,  max: 100 },
    coolantLevelPct: { mean: 72,   std: 8,   min: 30,  max: 100 },
    hydraulicPressureBar: { mean: 120, std: 30, min: 30, max: 220 },
    nominalRulDays:  480,
  },
};
