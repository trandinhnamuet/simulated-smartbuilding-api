import { Injectable } from '@nestjs/common';
import { Room } from '../rooms/entities/room.entity';
import { EnvSensorReading } from '../env-sensor-readings/entities/env-sensor-reading.entity';
import { ROOM_TYPE_BASELINES, EnvSensorRange } from './env-baselines';

@Injectable()
export class EnvSimulationService {
  /** Box-Muller Gaussian sample */
  private gaussian(mean: number, std: number): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Bounded Gaussian with mean-reversion to previous value */
  private sample(
    range: EnvSensorRange,
    hourlyMultiplier: number,
    previous?: number,
    reversionStrength = 0.12,
  ): number {
    const adjustedMean = range.mean * hourlyMultiplier;
    const base = previous ?? adjustedMean;
    const noise = this.gaussian(0, range.std * 0.3);
    const reversion = (adjustedMean - base) * reversionStrength;
    const val = base + noise + reversion;
    return parseFloat(Math.max(range.min, Math.min(range.max, val)).toFixed(3));
  }

  /**
   * Generate one environmental sensor snapshot for a room.
   * Uses time-of-day patterns from the KETI dataset to produce realistic readings.
   */
  generateReading(
    room: Room,
    previous?: EnvSensorReading,
    atTime?: Date,
  ): Partial<EnvSensorReading> {
    const baseline = ROOM_TYPE_BASELINES[room.roomType] ?? ROOM_TYPE_BASELINES['OFFICE'];
    const now = atTime ?? new Date();
    const hour = now.getHours();

    const co2Mult  = baseline.co2HourlyPattern[hour];
    const pirMult  = baseline.pirHourlyPattern[hour];
    const luxMult  = baseline.luxHourlyPattern[hour];

    // Temperature drifts slowly — slight daily cycle (cooler at night)
    const tempDailyOffset = -1.5 * Math.cos((2 * Math.PI * hour) / 24);
    const tempBase = { ...baseline.temperatureC, mean: baseline.temperatureC.mean + tempDailyOffset };

    // Humidity inverse-correlates with temperature slightly
    const humBase = { ...baseline.humidityPct };

    const co2Ppm      = this.sample(baseline.co2Ppm,      Math.max(0.4, co2Mult), previous?.co2Ppm);
    const humidityPct = this.sample(humBase,              1.0,                    previous?.humidityPct);
    const temperatureC = this.sample(tempBase,            1.0,                    previous?.temperatureC, 0.08);

    // Luminosity: during occupied hours use lux baseline, else near-zero
    const luxEffective = {
      ...baseline.luminosityLux,
      mean: baseline.luminosityLux.mean * luxMult,
      std:  baseline.luminosityLux.std  * 0.5,
    };
    const luminosityLux = parseFloat(
      Math.max(0, this.sample(luxEffective, 1.0, previous?.luminosityLux, 0.2)).toFixed(1),
    );

    // PIR: occupancy probability weighted by hour
    const hourlyOccupancyProb = baseline.pirOccupancyRate * (pirMult + 0.01);
    const isOccupied = Math.random() < hourlyOccupancyProb;
    const pirValue = isOccupied
      ? parseFloat(
          Math.max(
            baseline.pirActiveValue.min,
            this.gaussian(baseline.pirActiveValue.mean, baseline.pirActiveValue.std),
          ).toFixed(3),
        )
      : 0;

    return {
      roomId: room.id,
      timestamp: now,
      co2Ppm:       parseFloat(co2Ppm.toFixed(2)),
      humidityPct:  parseFloat(humidityPct.toFixed(2)),
      temperatureC: parseFloat(temperatureC.toFixed(2)),
      luminosityLux,
      pirValue,
      isOccupied,
    };
  }

  /**
   * Generate a batch of sequential readings with temporal continuity.
   * @param intervalSec  Seconds between each simulated reading (default: 5 s, matching dataset)
   */
  generateBatch(
    room: Room,
    count: number,
    intervalSec = 5,
    previous?: EnvSensorReading,
  ): Partial<EnvSensorReading>[] {
    const readings: Partial<EnvSensorReading>[] = [];
    let prev = previous;
    const startMs = Date.now() - count * intervalSec * 1000;

    for (let i = 0; i < count; i++) {
      const atTime = new Date(startMs + i * intervalSec * 1000);
      const r = this.generateReading(room, prev as EnvSensorReading, atTime);
      readings.push(r);
      prev = r as EnvSensorReading;
    }

    return readings;
  }
}
