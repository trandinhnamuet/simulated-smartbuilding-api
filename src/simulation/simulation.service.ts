import { Injectable } from '@nestjs/common';
import { Machine } from '../machines/entities/machine.entity';
import { SensorReading } from '../sensor-readings/entities/sensor-reading.entity';
import { MACHINE_BASELINES, SensorRange } from './machine-baselines';
import { MachineType } from '../common/enums/machine-type.enum';

@Injectable()
export class SimulationService {
  /**
   * Box-Muller transform: generates a sample from N(mean, std).
   */
  private gaussianRandom(mean: number, std: number): number {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return (
      mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
    );
  }

  /**
   * Generate a bounded random value. If `previous` is supplied the new value
   * undergoes mean-reversion so successive readings look physically continuous.
   */
  private sampleValue(
    range: SensorRange,
    previous?: number,
    reversionStrength = 0.15,
  ): number {
    const base = previous ?? range.mean;
    const noise = this.gaussianRandom(0, range.std * 0.35);
    const reversion = (range.mean - base) * reversionStrength;
    const next = base + noise + reversion;
    return parseFloat(Math.max(range.min, Math.min(range.max, next)).toFixed(3));
  }

  /**
   * Determine if this reading should be flagged as an anomaly (~4 % chance).
   */
  private rollAnomaly(): boolean {
    return Math.random() < 0.04;
  }

  /**
   * Simulate one sensor-reading snapshot for a machine.
   *
   * @param machine     The machine entity (needs machineType, totalRuntimeHours, totalCycleCount, remainingUsefulLifeDays).
   * @param previous    Optional last reading for temporal continuity.
   * @param intervalSec Elapsed seconds since the last reading (defaults to 30 s).
   */
  generateReading(
    machine: Machine,
    previous?: SensorReading,
    intervalSec = 30,
  ): Partial<SensorReading> {
    const baseline = MACHINE_BASELINES[machine.machineType as MachineType];
    if (!baseline) throw new Error(`Unknown machine type: ${machine.machineType}`);

    const isAnomaly = this.rollAnomaly();
    const anomalyFactor = isAnomaly ? 1 + Math.random() * 0.4 : 1;

    const temperatureC = parseFloat(
      (this.sampleValue(baseline.temperatureC, previous?.temperatureC) * anomalyFactor).toFixed(2),
    );
    const vibrationMs2 = parseFloat(
      (this.sampleValue(baseline.vibrationMs2, previous?.vibrationMs2) * anomalyFactor).toFixed(3),
    );
    const soundDb = parseFloat(
      (this.sampleValue(baseline.soundDb, previous?.soundDb) * anomalyFactor).toFixed(2),
    );
    const powerKw = parseFloat(
      (this.sampleValue(baseline.powerKw, previous?.powerKw) * anomalyFactor).toFixed(3),
    );

    // Fluid levels drift downward slowly and refill randomly
    const oilLevelPct = parseFloat(
      Math.max(
        5,
        (previous?.oilLevelPct ?? baseline.oilLevelPct.mean) -
          Math.random() * 0.05 +
          (Math.random() < 0.02 ? 10 : 0),
      ).toFixed(2),
    );

    const coolantLevelPct =
      baseline.coolantLevelPct !== null
        ? parseFloat(
            Math.max(
              5,
              (previous?.coolantLevelPct ?? baseline.coolantLevelPct!.mean) -
                Math.random() * 0.04 +
                (Math.random() < 0.02 ? 8 : 0),
            ).toFixed(2),
          )
        : null;

    // Machine-specific sensors
    const laserIntensityW = baseline.laserIntensityW
      ? parseFloat(
          (this.sampleValue(baseline.laserIntensityW, previous?.laserIntensityW ?? undefined) * anomalyFactor).toFixed(1),
        )
      : null;

    const hydraulicPressureBar = baseline.hydraulicPressureBar
      ? parseFloat(
          (this.sampleValue(baseline.hydraulicPressureBar, previous?.hydraulicPressureBar ?? undefined) * anomalyFactor).toFixed(2),
        )
      : null;

    const spindleSpeedRpm = baseline.spindleSpeedRpm
      ? parseFloat(
          this.sampleValue(baseline.spindleSpeedRpm, previous?.spindleSpeedRpm ?? undefined).toFixed(0),
        )
      : null;

    // Tool wear increases monotonically with cycle count
    let toolWearMm: number | null = null;
    if (baseline.toolWearMm) {
      const drift = (baseline.toolWearRatePerCycle ?? 0.0002) * (machine.totalCycleCount + 1);
      toolWearMm = parseFloat(
        Math.min(baseline.toolWearMm.max, (previous?.toolWearMm ?? 0) + drift + Math.random() * 0.01).toFixed(3),
      );
    }

    const pressureBar = baseline.pressureBar
      ? parseFloat(
          (this.sampleValue(baseline.pressureBar, previous?.pressureBar ?? undefined) * anomalyFactor).toFixed(2),
        )
      : null;

    const flowRateLMin = baseline.flowRateLMin
      ? parseFloat(
          (this.sampleValue(baseline.flowRateLMin, previous?.flowRateLMin ?? undefined) * anomalyFactor).toFixed(2),
        )
      : null;

    const runtimeHours = parseFloat(
      (machine.totalRuntimeHours + intervalSec / 3600).toFixed(4),
    );
    const cycleCount = machine.totalCycleCount + 1;

    // RUL degrades proportionally; anomaly spikes cost more life
    const baseRul =
      previous?.remainingUsefulLifeDays ?? machine.remainingUsefulLifeDays ?? baseline.nominalRulDays;
    const rulDecrement = (intervalSec / 86400) * (isAnomaly ? 5 : 1);
    const remainingUsefulLifeDays = parseFloat(Math.max(0, baseRul - rulDecrement).toFixed(2));
    const failureWithin7Days = remainingUsefulLifeDays <= 7;

    return {
      machineId: machine.id,
      timestamp: new Date(),
      temperatureC,
      vibrationMs2,
      soundDb,
      powerKw,
      oilLevelPct,
      coolantLevelPct,
      laserIntensityW,
      hydraulicPressureBar,
      spindleSpeedRpm,
      toolWearMm,
      pressureBar,
      flowRateLMin,
      runtimeHours,
      cycleCount,
      isAnomaly,
      remainingUsefulLifeDays,
      failureWithin7Days,
    };
  }

  /**
   * Generate `count` readings in sequence, each building on the previous.
   */
  generateBatch(
    machine: Machine,
    count: number,
    intervalSec = 30,
    previous?: SensorReading,
  ): Partial<SensorReading>[] {
    const readings: Partial<SensorReading>[] = [];
    let prev = previous;
    let currentMachine = { ...machine };

    for (let i = 0; i < count; i++) {
      const r = this.generateReading(currentMachine as Machine, prev as SensorReading, intervalSec);
      readings.push(r);
      // Accumulate runtime and cycles for the next iteration
      currentMachine.totalRuntimeHours = r.runtimeHours!;
      currentMachine.totalCycleCount = r.cycleCount!;
      currentMachine.remainingUsefulLifeDays = r.remainingUsefulLifeDays!;
      prev = r as SensorReading;
    }

    return readings;
  }
}
