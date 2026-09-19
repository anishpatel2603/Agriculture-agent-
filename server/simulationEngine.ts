import {
  Plot,
  SensorReading,
  WeatherData,
  FarmAction,
  QualityStatus,
  SensorType,
} from '../src/types';
import { CROP_BENCHMARKS, SOIL_CHARACTERISTICS } from './agronomyRules';

export class SimulationEngine {
  private isRunning: boolean = true;
  private speed: number = 2; // Default 2x speed
  private cycleCount: number = 1;

  public weather: WeatherData = {
    temperatureC: 29.5,
    humidityPercent: 78,
    rainfallMmPast24h: 12.0,
    forecastRainfallMmNext24h: 18.5,
    forecastRainProbability: 65,
    windSpeedKmh: 14,
    solarRadiationWm2: 640,
    condition: 'Overcast',
    monsoonStatus: 'Active Monsoon',
    dataSource: 'IMD AWS Gridded (Thane/Mumbai Station)',
    lastUpdated: new Date().toISOString(),
    isSimulated: true,
  };

  public getStatus() {
    return {
      isRunning: this.isRunning,
      speed: this.speed,
      cycleCount: this.cycleCount,
      weather: this.weather,
    };
  }

  public setSpeed(speed: number) {
    this.speed = Math.max(1, Math.min(20, speed));
  }

  public setRunning(running: boolean) {
    this.isRunning = running;
  }

  public incrementCycle() {
    this.cycleCount++;
  }

  public getCycleCount() {
    return this.cycleCount;
  }

  /**
   * Advances simulation by one discrete time-step.
   * Modifies plots, active actions, and weather dynamically.
   */
  public step(
    plots: Plot[],
    activeActions: FarmAction[],
    onActionCompleted: (action: FarmAction, finalMoisture: number) => void
  ): { updatedPlots: Plot[]; newReadings: SensorReading[] } {
    const timestamp = new Date().toISOString();
    const newReadings: SensorReading[] = [];

    // 1. Natural Weather Diurnal Drift
    const tempNoise = (Math.random() - 0.48) * 0.3 * this.speed;
    this.weather.temperatureC = Math.max(
      18,
      Math.min(45, +(this.weather.temperatureC + tempNoise).toFixed(1))
    );

    const humNoise = (Math.random() - 0.52) * 0.6 * this.speed;
    this.weather.humidityPercent = Math.max(
      25,
      Math.min(98, +(this.weather.humidityPercent + humNoise).toFixed(0))
    );

    this.weather.lastUpdated = timestamp;

    // 2. Iterate each plot
    const updatedPlots = plots.map((plot) => {
      const benchmark = CROP_BENCHMARKS[plot.cropType] || CROP_BENCHMARKS.Rice;
      const soil = SOIL_CHARACTERISTICS[plot.soilType] || SOIL_CHARACTERISTICS.Loam;
      const kc = benchmark.kcValues[plot.growthStage] || 0.8;

      // Check if an active irrigation action is running for this plot
      const activeAction = activeActions.find(
        (a) => a.plotId === plot.id && a.executionStatus === 'RUNNING'
      );

      let newMoisture = plot.currentMoisture;
      let newTemp = +(this.weather.temperatureC + (Math.random() - 0.5) * 1.2).toFixed(1);
      let newHumidity = +(this.weather.humidityPercent + (Math.random() - 0.5) * 2).toFixed(0);

      if (activeAction) {
        // Irrigation active! Water increases moisture
        const deltaMoisture = 2.0 * this.speed * (1.1 - soil.drainageRate * 0.4);
        newMoisture = Math.min(96, +(newMoisture + deltaMoisture).toFixed(1));

        // Advance action progress
        const stepProgress =
          (100 / ((activeAction.parameters.durationMinutes || 15) * 6)) * this.speed;
        activeAction.progressPercent = Math.min(
          100,
          +(activeAction.progressPercent + stepProgress).toFixed(1)
        );

        if (activeAction.progressPercent >= 100) {
          activeAction.executionStatus = 'COMPLETED';
          activeAction.completedAt = timestamp;
          activeAction.finalMoisture = newMoisture;
          activeAction.feedbackSummary = `Irrigation completed. Soil moisture transitioned from ${activeAction.initialMoisture}% to ${newMoisture}%.`;
          onActionCompleted(activeAction, newMoisture);
        }
      } else {
        // Natural Evapotranspiration depletion
        const tempFactor = Math.max(0.5, this.weather.temperatureC / 28);
        const evapotranspirationRate =
          0.22 * kc * tempFactor * (0.8 + soil.drainageRate * 0.35) * (this.speed * 0.4);

        // Slow depletion
        newMoisture = Math.max(8, +(newMoisture - evapotranspirationRate).toFixed(1));

        // If it rained recently, add rain contribution
        if (this.weather.rainfallMmPast24h > 0) {
          newMoisture = Math.min(
            95,
            +(newMoisture + 0.25 * this.weather.rainfallMmPast24h).toFixed(1)
          );
        }
      }

      // Generate realistic sensor readings for each sensor type
      const moistureQuality: QualityStatus =
        plot.status === 'SENSOR_ANOMALY' ? 'anomalous' : 'valid';

      newReadings.push({
        id: `read-${Date.now()}-${plot.id}-sm`,
        plotId: plot.id,
        sensorType: 'soil_moisture',
        value: newMoisture,
        unit: '%',
        timestamp,
        source: 'simulated',
        qualityStatus: moistureQuality,
      });

      newReadings.push({
        id: `read-${Date.now()}-${plot.id}-st`,
        plotId: plot.id,
        sensorType: 'soil_temperature',
        value: newTemp,
        unit: '°C',
        timestamp,
        source: 'simulated',
        qualityStatus: 'valid',
      });

      newReadings.push({
        id: `read-${Date.now()}-${plot.id}-hum`,
        plotId: plot.id,
        sensorType: 'humidity',
        value: newHumidity,
        unit: '%',
        timestamp,
        source: 'simulated',
        qualityStatus: 'valid',
      });

      if (plot.currentPh !== undefined) {
        newReadings.push({
          id: `read-${Date.now()}-${plot.id}-ph`,
          plotId: plot.id,
          sensorType: 'soil_ph',
          value: plot.currentPh,
          unit: 'pH',
          timestamp,
          source: 'simulated',
          qualityStatus: 'valid',
        });
      }

      if (plot.nitrogenMgKg !== undefined) {
        newReadings.push({
          id: `read-${Date.now()}-${plot.id}-n`,
          plotId: plot.id,
          sensorType: 'nitrogen',
          value: plot.nitrogenMgKg,
          unit: 'mg/kg',
          timestamp,
          source: 'simulated',
          qualityStatus: 'valid',
        });
      }

      return {
        ...plot,
        currentMoisture: newMoisture,
        currentTemp: newTemp,
        currentHumidity: newHumidity,
        lastReadingTime: timestamp,
      };
    });

    this.incrementCycle();
    return { updatedPlots, newReadings };
  }
}
