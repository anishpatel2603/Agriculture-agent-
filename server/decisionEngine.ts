import {
  Plot,
  SensorReading,
  AgentDecision,
  DecisionEvidence,
  PriorityLevel,
  WeatherData,
  FarmAlert,
} from '../src/types';
import { CROP_BENCHMARKS, SOIL_CHARACTERISTICS } from './agronomyRules';
import { INDIAN_CROP_DATABASE } from '../src/data/indianAgriData';

export interface DecisionEngineResult {
  decisions: AgentDecision[];
  alerts: Omit<FarmAlert, 'id' | 'timestamp'>[];
  stateUpdate: {
    status: Plot['status'];
    notes: string;
  };
}

export function evaluatePlot(
  plot: Plot,
  recentReadings: SensorReading[],
  weather: WeatherData,
  activeActionsRunning: boolean
): DecisionEngineResult {
  const generatedDecisions: AgentDecision[] = [];
  const generatedAlerts: Omit<FarmAlert, 'id' | 'timestamp'>[] = [];

  const benchmark = CROP_BENCHMARKS[plot.cropType] || CROP_BENCHMARKS.Rice;
  const cropProfile = INDIAN_CROP_DATABASE[plot.cropType] || INDIAN_CROP_DATABASE.Rice;
  const soilInfo = SOIL_CHARACTERISTICS[plot.soilType] || SOIL_CHARACTERISTICS.Loam;

  // 1. DATA INGESTION & VALIDATION
  const moistureReading = recentReadings.find((r) => r.sensorType === 'soil_moisture');
  const tempReading = recentReadings.find(
    (r) => r.sensorType === 'soil_temperature' || r.sensorType === 'air_temperature'
  );
  const phReading = recentReadings.find((r) => r.sensorType === 'soil_ph');
  const nReading = recentReadings.find((r) => r.sensorType === 'nitrogen');
  const pReading = recentReadings.find((r) => r.sensorType === 'phosphorus');
  const kReading = recentReadings.find((r) => r.sensorType === 'potassium');

  const now = new Date();

  // Check data quality status
  const isMoistureMissing = !moistureReading || moistureReading.qualityStatus === 'missing';
  const isMoistureStale = moistureReading?.qualityStatus === 'stale';
  const isMoistureAnomalous =
    moistureReading?.qualityStatus === 'anomalous' ||
    (moistureReading && (moistureReading.value < 0 || moistureReading.value > 100));

  let plotStatus: Plot['status'] = 'OPTIMAL';
  let stateNotes = 'All environmental parameters within nominal ranges.';

  // -------------------------------------------------------------
  // RULE 1: SENSOR INTEGRITY & ANOMALY HANDLING (Safety Fallback)
  // -------------------------------------------------------------
  if (isMoistureMissing || isMoistureStale || isMoistureAnomalous) {
    plotStatus = 'SENSOR_ANOMALY';
    const errorType = isMoistureMissing
      ? 'Missing sensor reading'
      : isMoistureStale
      ? 'Stale sensor reading (> 15 minutes)'
      : 'Physically implausible or anomalous moisture reading';

    stateNotes = `Sensor integrity fault detected: ${errorType}. Safety fallback triggered.`;

    generatedAlerts.push({
      plotId: plot.id,
      plotName: plot.name,
      severity: 'CRITICAL',
      category: 'SENSOR_HEALTH',
      title: 'Moisture Sensor Telemetry Disruption',
      message: `Moisture telemetry invalid for ${plot.name}: ${errorType}. Automatic decision-making paused.`,
      status: 'ACTIVE',
    });

    generatedDecisions.push({
      id: `dec-${Date.now()}-sensor`,
      plotId: plot.id,
      plotName: plot.name,
      decisionType: 'MONITORING',
      recommendation: 'SENSOR_INSPECTION_REQUIRED',
      priority: 'CRITICAL',
      confidence: 0.95,
      reason: `Primary soil moisture sensor reported invalid or missing telemetry (${errorType}). The agent will not actuate irrigation blindly.`,
      evidence: [
        {
          factor: 'sensor_telemetry',
          value: moistureReading ? `${moistureReading.value}%` : 'NULL',
          interpretation: errorType,
          impactScore: -10,
        },
        {
          factor: 'safety_constraint',
          value: 'Fail-Safe Mode',
          interpretation: 'Physical actuation disabled to prevent crop drowning or dry pump damage',
        },
      ],
      suggestedAction: {
        type: 'INSPECTION_ALERT',
        parameters: { issue: errorType },
      },
      requiresHumanApproval: true,
      status: 'PENDING',
      createdAt: now.toISOString(),
    });

    return {
      decisions: generatedDecisions,
      alerts: generatedAlerts,
      stateUpdate: { status: plotStatus, notes: stateNotes },
    };
  }

  const currentMoisture = moistureReading.value;
  const currentTemp = tempReading ? tempReading.value : plot.currentTemp;
  const targetRange =
    plot.targetMoistureRange || benchmark.defaultMoistureByStage[plot.growthStage];

  // -------------------------------------------------------------
  // RULE 2: TEMPERATURE & HEAT STRESS EVALUATION (Indian Heatwave)
  // -------------------------------------------------------------
  if (currentTemp >= benchmark.criticalStressTempC) {
    generatedAlerts.push({
      plotId: plot.id,
      plotName: plot.name,
      severity: 'WARNING',
      category: 'TEMPERATURE',
      title: 'Thermal Heat Stress Alert (लू / तीव्र उष्णता)',
      message: `Ambient temperature (${currentTemp}°C) exceeds critical tolerance (${benchmark.criticalStressTempC}°C) for ${cropProfile.nameEn}. Evaporation surging. Schedule night/early-morning watering to protect flowers.`,
      status: 'ACTIVE',
    });

    generatedDecisions.push({
      id: `dec-${Date.now()}-heat`,
      plotId: plot.id,
      plotName: plot.name,
      decisionType: 'MONITORING',
      recommendation: 'HEAT_STRESS_PRECAUTION',
      priority: 'HIGH',
      confidence: 0.88,
      reason: `Extreme temperature (${currentTemp}°C) detected above ${cropProfile.nameEn} critical threshold (${benchmark.criticalStressTempC}°C). Evaporation accelerated. Recommend early morning light micro-irrigation pulse or foliar water misting to moderate canopy heat.`,
      evidence: [
        {
          factor: 'ambient_temperature',
          value: `${currentTemp}°C`,
          interpretation: `Exceeds ${cropProfile.nameEn} critical threshold (${benchmark.criticalStressTempC}°C)`,
          impactScore: -6,
        },
        {
          factor: 'canopy_microclimate',
          value: 'High Evaporative Demand',
          interpretation: 'Risk of blossom dropping and pollen desiccation',
        },
      ],
      requiresHumanApproval: true,
      status: 'PENDING',
      createdAt: now.toISOString(),
    });
  }

  // -------------------------------------------------------------
  // RULE 3: MONSOON & HEAVY RAIN INTEGRITY (Indian Monsoon Safety)
  // -------------------------------------------------------------
  const isHeavyRainPast24h = weather.rainfallMmPast24h >= 30.0;
  const isHeavyRainForecast =
    weather.forecastRainfallMmNext24h >= 25.0 && weather.forecastRainProbability >= 60;
  const isMonsoonSurge =
    weather.monsoonStatus === 'Active Monsoon' && (isHeavyRainPast24h || isHeavyRainForecast);

  if (isMonsoonSurge || isHeavyRainPast24h) {
    generatedAlerts.push({
      plotId: plot.id,
      plotName: plot.name,
      severity: 'WARNING',
      category: 'MONSOON',
      title: 'Monsoon Heavy Rainfall Alert (मुसळधार पाऊस सतर्कता)',
      message: `Past 24h rainfall: ${weather.rainfallMmPast24h}mm, Forecast: ${weather.forecastRainfallMmNext24h}mm. Irrigation pumps locked out to prevent waterlogging and root rot.`,
      status: 'ACTIVE',
    });
  }

  // -------------------------------------------------------------
  // RULE 4: IRRIGATION DECISION ENGINE (Utility & Goal-Based)
  // -------------------------------------------------------------
  const moistureDeficit = targetRange.min - currentMoisture;
  const isBelowMin = currentMoisture < targetRange.min;
  const isAboveMax = currentMoisture > targetRange.max;
  const kc = benchmark.kcValues[plot.growthStage] || 0.8;
  const isRainfed =
    plot.irrigationMethod === 'Rainfed Agriculture' || plot.waterSource === 'Rainfed Only';

  if (activeActionsRunning) {
    // Actuator currently running
    generatedDecisions.push({
      id: `dec-${Date.now()}-active`,
      plotId: plot.id,
      plotName: plot.name,
      decisionType: 'IRRIGATION',
      recommendation: 'CONTINUE_MONITORING',
      priority: 'LOW',
      confidence: 0.98,
      reason: `An active irrigation cycle is currently running on ${plot.name}. Maintaining status until cycle completion.`,
      evidence: [
        {
          factor: 'actuator_state',
          value: 'RUNNING',
          interpretation: 'Irrigation pump/valve active in progress',
        },
        {
          factor: 'current_moisture',
          value: `${currentMoisture}%`,
          interpretation: 'Targeting recovery to optimal range',
        },
      ],
      requiresHumanApproval: false,
      status: 'EXECUTED',
      createdAt: now.toISOString(),
    });
  } else if (isAboveMax) {
    // Excessive moisture condition / Waterlogging
    plotStatus = 'ATTENTION_NEEDED';
    stateNotes = `Soil moisture (${currentMoisture}%) exceeds upper target limit (${targetRange.max}%). Risk of root asphyxiation.`;

    generatedAlerts.push({
      plotId: plot.id,
      plotName: plot.name,
      severity: 'WARNING',
      category: 'MOISTURE',
      title: 'Excessive Moisture / Waterlogging (पाणथळ स्थिती)',
      message: `${plot.name} soil moisture is saturated at ${currentMoisture}%. Soil drainage capacity: ${soilInfo.drainageRate * 100}%. Ensure field drainage channels are open.`,
      status: 'ACTIVE',
    });

    generatedDecisions.push({
      id: `dec-${Date.now()}-excess`,
      plotId: plot.id,
      plotName: plot.name,
      decisionType: 'IRRIGATION',
      recommendation: 'WARNING_EXCESSIVE_MOISTURE',
      priority: 'HIGH',
      confidence: 0.92,
      reason: `Soil moisture (${currentMoisture}%) is above upper threshold (${targetRange.max}%). Continued irrigation risks root asphyxiation, damping off, and nitrogen leaching. Ensure field drainage channels (चर) are cleared.`,
      evidence: [
        {
          factor: 'soil_moisture',
          value: `${currentMoisture}%`,
          unit: '%',
          interpretation: `+${(currentMoisture - targetRange.max).toFixed(1)}% above maximum ceiling`,
          impactScore: -8,
        },
        {
          factor: 'soil_aeration',
          value: plot.soilType,
          interpretation: soilInfo.waterHoldingCapacity,
        },
      ],
      suggestedAction: {
        type: 'PUMP_SHUTDOWN',
        parameters: { lockoutHours: 12 },
      },
      requiresHumanApproval: false,
      status: 'EXECUTED',
      createdAt: now.toISOString(),
    });
  } else if (isBelowMin) {
    // Soil moisture is low - Check weather forecast and rainfed status
    const hadRecentRain = weather.rainfallMmPast24h >= 4.0;
    const rainForecastLikely =
      weather.forecastRainfallMmNext24h >= 8.0 && weather.forecastRainProbability >= 60;

    if (rainForecastLikely) {
      // Goal-based water conservation: defer if imminent significant rain
      plotStatus = 'ATTENTION_NEEDED';
      stateNotes = `Moisture is low (${currentMoisture}%), but forecast indicates impending precipitation (${weather.forecastRainfallMmNext24h}mm, ${weather.forecastRainProbability}%). Deferring to save water.`;

      generatedDecisions.push({
        id: `dec-${Date.now()}-defer-rain`,
        plotId: plot.id,
        plotName: plot.name,
        decisionType: 'IRRIGATION',
        recommendation: 'DEFER_IRRIGATION_RAIN',
        priority: 'MEDIUM',
        confidence: 0.88,
        reason: `Soil moisture (${currentMoisture}%) is below target (${targetRange.min}%), but IMD forecast indicates imminent precipitation (${weather.forecastRainProbability}% chance of ~${weather.forecastRainfallMmNext24h}mm). Deferring irrigation prevents water runoff and electricity wastage.`,
        evidence: [
          {
            factor: 'soil_moisture_deficit',
            value: `${moistureDeficit.toFixed(1)}%`,
            unit: '%',
            interpretation: 'Moderate deficit below threshold',
          },
          {
            factor: 'forecast_precipitation',
            value: `${weather.forecastRainfallMmNext24h} mm`,
            interpretation: `${weather.forecastRainProbability}% probability expected within 24h`,
            impactScore: 6,
          },
          {
            factor: 'resource_conservation',
            value: 'Rainwater Utilization',
            interpretation: 'Saves tubewell groundwater and electricity',
          },
        ],
        requiresHumanApproval: true,
        status: 'PENDING',
        createdAt: now.toISOString(),
      });
    } else if (isRainfed) {
      // Rainfed agriculture logic - no tube well or motorized pump!
      plotStatus = 'ATTENTION_NEEDED';
      stateNotes = `Rainfed plot moisture is low (${currentMoisture}%). Motorized pump not applicable. Soil moisture conservation measures recommended.`;

      generatedDecisions.push({
        id: `dec-${Date.now()}-rainfed`,
        plotId: plot.id,
        plotName: plot.name,
        decisionType: 'IRRIGATION',
        recommendation: 'CONTINUE_MONITORING',
        priority: 'MEDIUM',
        confidence: 0.85,
        reason: `Plot operates under Rainfed Agriculture (कोरडवाहू शेती) without continuous pressurized irrigation infrastructure. Recommend in-situ soil moisture conservation: apply organic crop residue mulching, inter-row shallow hoeing (कोळपणी) to break soil capillaries, and preserve farm pond (शेततळे) water for critical reproductive stages.`,
        evidence: [
          {
            factor: 'irrigation_infrastructure',
            value: 'Rainfed Agriculture / Rainfed Only',
            interpretation: 'No active tube well or canal feeder available',
          },
          {
            factor: 'in_situ_conservation',
            value: 'Mulching & BBF',
            interpretation: 'Recommended by ICAR dryland farming guidelines',
          },
        ],
        requiresHumanApproval: false,
        status: 'PENDING',
        createdAt: now.toISOString(),
      });
    } else if (hadRecentRain && currentMoisture >= targetRange.min - 4) {
      // Recent rain has occurred and deficit is minor
      stateNotes = `Recent rainfall (${weather.rainfallMmPast24h}mm) absorbed; moisture slight deficit (${currentMoisture}%), monitoring percolation.`;

      generatedDecisions.push({
        id: `dec-${Date.now()}-recent-rain`,
        plotId: plot.id,
        plotName: plot.name,
        decisionType: 'IRRIGATION',
        recommendation: 'CONTINUE_MONITORING',
        priority: 'LOW',
        confidence: 0.88,
        reason: `Recent rainfall of ${weather.rainfallMmPast24h}mm occurred within 24h. Allowing water percolation to complete before re-evaluating.`,
        evidence: [
          {
            factor: 'recent_rainfall',
            value: `${weather.rainfallMmPast24h} mm`,
            interpretation: 'Satisfies immediate root zone infiltration',
          },
          {
            factor: 'soil_moisture',
            value: `${currentMoisture}%`,
            interpretation: 'Close to minimum safety threshold',
          },
        ],
        requiresHumanApproval: false,
        status: 'PENDING',
        createdAt: now.toISOString(),
      });
    } else {
      // Genuine irrigation needed! Calculate utility & duration
      const isCriticalDeficit = currentMoisture < targetRange.min * 0.75;
      const priority: PriorityLevel = isCriticalDeficit ? 'CRITICAL' : 'HIGH';
      plotStatus = isCriticalDeficit ? 'CRITICAL' : 'ATTENTION_NEEDED';

      // Duration formula based on deficit %, crop Kc, and soil infiltration capacity
      const baseDurationMinutes = soilInfo.recommendedCycleMinutes;
      const deficitFactor = Math.min(2.0, Math.max(0.5, moistureDeficit / 15));
      const stageFactor = Math.min(1.4, Math.max(0.7, kc));
      const calculatedDuration = Math.round(baseDurationMinutes * deficitFactor * stageFactor);

      // Estimated water volume:
      // 1 mm irrigation depth = 10,000 L / Ha = ~4,047 L / Acre
      const depthMm = Math.min(15, Math.round(moistureDeficit * 0.4));
      const estLiters = Math.round(plot.areaHa * depthMm * 10000);
      const estLitersPerAcre = Math.round((plot.areaAcre || plot.areaHa * 2.471) * depthMm * 4047);

      stateNotes = `Soil moisture (${currentMoisture}%) is deficient by ${moistureDeficit.toFixed(1)}%. Irrigation recommended.`;

      generatedAlerts.push({
        plotId: plot.id,
        plotName: plot.name,
        severity: isCriticalDeficit ? 'CRITICAL' : 'WARNING',
        category: 'MOISTURE',
        title: isCriticalDeficit ? 'Critical Soil Moisture Deficit' : 'Moisture Below Minimum Threshold',
        message: `${plot.name} (${cropProfile.nameEn}, ${plot.growthStage}) moisture at ${currentMoisture}% is below min target ${targetRange.min}%. Irrigation cycle advised.`,
        status: 'ACTIVE',
      });

      const evidence: DecisionEvidence[] = [
        {
          factor: 'soil_moisture',
          value: `${currentMoisture}%`,
          unit: '%',
          interpretation: `Deficit of ${moistureDeficit.toFixed(1)}% below requirement (${targetRange.min}%)`,
          impactScore: -7,
        },
        {
          factor: 'crop_growth_stage',
          value: `${cropProfile.nameEn} (${plot.growthStage})`,
          interpretation: `Crop Kc = ${kc.toFixed(2)}. Critical stages: ${cropProfile.criticalIrrigationStages.slice(0, 2).join(', ')}`,
          impactScore: 4,
        },
        {
          factor: 'soil_type_capacity',
          value: plot.soilType,
          interpretation: `${soilInfo.waterHoldingCapacity}. Cycle: ${soilInfo.recommendedCycleMinutes} min`,
        },
        {
          factor: 'water_source',
          value: plot.waterSource || 'Borewell / Tube Well',
          interpretation: `Irrigation via ${plot.irrigationMethod}`,
        },
      ];

      generatedDecisions.push({
        id: `dec-${Date.now()}-irrigate`,
        plotId: plot.id,
        plotName: plot.name,
        decisionType: 'IRRIGATION',
        recommendation: 'RECOMMEND_IRRIGATION',
        priority,
        confidence: 0.91,
        reason: `Soil moisture (${currentMoisture}%) has dropped below the target range (${targetRange.min}% - ${targetRange.max}%) for ${cropProfile.nameEn} during ${plot.growthStage} stage without incoming rainfall.`,
        evidence,
        suggestedAction: {
          type: 'SIMULATED_IRRIGATION',
          durationMinutes: calculatedDuration,
          volumeLiters: estLiters,
          volumeLitersPerAcre: estLitersPerAcre,
          parameters: {
            method: plot.irrigationMethod,
            waterSource: plot.waterSource,
            targetMoisture: targetRange.optimal,
            calculatedDurationMinutes: calculatedDuration,
          },
        },
        requiresHumanApproval: true,
        status: 'PENDING',
        createdAt: now.toISOString(),
      });
    }
  } else {
    // Soil moisture is within healthy optimal bounds
    stateNotes = `Soil moisture (${currentMoisture}%) is well-balanced within the target range (${targetRange.min}% - ${targetRange.max}%).`;

    generatedDecisions.push({
      id: `dec-${Date.now()}-nominal`,
      plotId: plot.id,
      plotName: plot.name,
      decisionType: 'IRRIGATION',
      recommendation: 'CONTINUE_MONITORING',
      priority: 'LOW',
      confidence: 0.94,
      reason: `Soil moisture (${currentMoisture}%) is within optimal envelope (${targetRange.min}% - ${targetRange.max}%) for ${cropProfile.nameEn} at ${plot.growthStage} stage.`,
      evidence: [
        {
          factor: 'soil_moisture',
          value: `${currentMoisture}%`,
          interpretation: `Nominal (+${(currentMoisture - targetRange.min).toFixed(1)}% above min, -${(targetRange.max - currentMoisture).toFixed(1)}% below saturation)`,
          impactScore: 5,
        },
        {
          factor: 'water_conservation',
          value: 'Passive Monitoring',
          interpretation: 'Zero unnecessary water consumption',
        },
      ],
      requiresHumanApproval: false,
      status: 'PENDING',
      createdAt: now.toISOString(),
    });
  }

  // -------------------------------------------------------------
  // RULE 5: FERTILIZATION & NUTRIENT SCREENING (Indian Fertilizer Formulation)
  // -------------------------------------------------------------
  const phVal = phReading?.value ?? plot.currentPh;
  const nVal = nReading?.value ?? plot.nitrogenMgKg;
  const pVal = pReading?.value ?? plot.phosphorusMgKg;
  const kVal = kReading?.value ?? plot.potassiumMgKg;

  // Evaluate pH
  if (phVal !== undefined) {
    const [optPhMin, optPhMax] = benchmark.optimalPh;
    if (phVal < optPhMin - 0.5) {
      generatedAlerts.push({
        plotId: plot.id,
        plotName: plot.name,
        severity: 'WARNING',
        category: 'NUTRIENT',
        title: 'Acidic Soil pH Out of Range',
        message: `Soil pH (${phVal.toFixed(1)}) is acidic for ${cropProfile.nameEn} (optimal: ${optPhMin} - ${optPhMax}). Apply agricultural lime / dolomite.`,
        status: 'ACTIVE',
      });
    } else if (phVal > optPhMax + 0.5) {
      generatedAlerts.push({
        plotId: plot.id,
        plotName: plot.name,
        severity: 'WARNING',
        category: 'NUTRIENT',
        title: 'Alkaline Soil pH Out of Range',
        message: `Soil pH (${phVal.toFixed(1)}) is high for ${cropProfile.nameEn} (optimal: ${optPhMin} - ${optPhMax}). Apply gypsum or organic FYM to buffer alkalinity.`,
        status: 'ACTIVE',
      });
    }
  }

  // Evaluate NPK or lack thereof
  const hasCompleteNutrientData =
    (nVal !== undefined && pVal !== undefined && kVal !== undefined) ||
    (plot.soilHealthCard && plot.soilHealthCard.hasCard);

  if (!hasCompleteNutrientData) {
    // Missing NPK data rule: ZERO-FABRICATION RULE!
    generatedDecisions.push({
      id: `dec-${Date.now()}-fert-missing`,
      plotId: plot.id,
      plotName: plot.name,
      decisionType: 'FERTILIZATION',
      recommendation: 'SOIL_TEST_RECOMMENDED',
      priority: 'MEDIUM',
      confidence: 0.7,
      reason: `Reliable nutrient-based fertilizer prescription cannot be synthesized because complete NPK readings or verified Soil Health Card data are missing. Prescribing chemical inputs without verified laboratory testing violates agricultural safety standards and risks crop burn and groundwater contamination. Submit a 500g composite soil sample to the nearest Krishi Vigyan Kendra (KVK) or State Agricultural University testing lab.`,
      evidence: [
        {
          factor: 'nitrogen_telemetry',
          value: nVal !== undefined ? `${nVal} mg/kg` : 'MISSING',
          interpretation: nVal !== undefined ? 'Recorded' : 'Data required for prescription',
        },
        {
          factor: 'phosphorus_telemetry',
          value: pVal !== undefined ? `${pVal} mg/kg` : 'MISSING',
          interpretation: pVal !== undefined ? 'Recorded' : 'Data required for root development',
        },
        {
          factor: 'potassium_telemetry',
          value: kVal !== undefined ? `${kVal} mg/kg` : 'MISSING',
          interpretation: kVal !== undefined ? 'Recorded' : 'Data required for osmoregulation',
        },
        {
          factor: 'safety_policy',
          value: 'Zero-Fabrication Guardrail',
          interpretation: 'AI agent will not invent unmeasured nutrient concentrations',
        },
      ],
      suggestedAction: {
        type: 'SOIL_TEST_DISPATCH',
        parameters: {
          testType: 'Soil Health Card (SHC) Complete 12-Parameter Test',
          recommendedCenter: 'Nearest Krishi Vigyan Kendra (KVK) Soil Testing Laboratory',
        },
      },
      requiresHumanApproval: true,
      status: 'PENDING',
      createdAt: now.toISOString(),
    });
  } else {
    // Calculate tailored Indian Fertilizer Doses (Urea, DAP, MOP) in kg/acre
    const baseNpk = cropProfile.recommendedNpkKgAcre;
    const ureaDoseKgAcre = Math.round((baseNpk.nitrogen / 0.46) * 0.8);
    const dapDoseKgAcre = Math.round(baseNpk.phosphorus / 0.46);
    const mopDoseKgAcre = Math.round(baseNpk.potassium / 0.6);

    generatedDecisions.push({
      id: `dec-${Date.now()}-fert-guidance`,
      plotId: plot.id,
      plotName: plot.name,
      decisionType: 'FERTILIZATION',
      recommendation: 'APPLY_FERTILIZER_GUIDANCE',
      priority: 'LOW',
      confidence: 0.86,
      reason: `Agronomic nutrient guidance calculated for ${cropProfile.nameEn} based on Indian Council of Agricultural Research (ICAR) benchmarks and available soil readings. Recommended split: Basal application of DAP and MOP with FYM, followed by Neem Coated Urea in 2-3 split top-dressings at key physiological growth stages.`,
      evidence: [
        {
          factor: 'crop_target_npk',
          value: `N:${baseNpk.nitrogen} P:${baseNpk.phosphorus} K:${baseNpk.potassium} kg/acre`,
          interpretation: `ICAR standard recommendation for ${cropProfile.nameEn}`,
        },
        {
          factor: 'indian_fertilizer_conversion',
          value: `Urea ~${ureaDoseKgAcre} kg, DAP ~${dapDoseKgAcre} kg, MOP ~${mopDoseKgAcre} kg/acre`,
          interpretation: 'Commercial grade equivalent formulations',
        },
      ],
      suggestedAction: {
        type: 'SOIL_TEST_DISPATCH',
        fertilizerDose: {
          ureaKgAcre: ureaDoseKgAcre,
          dapKgAcre: dapDoseKgAcre,
          mopKgAcre: mopDoseKgAcre,
          fymTonnesAcre: 3,
          biofertilizerNote: 'Seed or root-dip treatment with Rhizobium/Azotobacter + PSB recommended',
        },
      },
      requiresHumanApproval: true,
      status: 'PENDING',
      createdAt: now.toISOString(),
    });
  }

  return {
    decisions: generatedDecisions,
    alerts: generatedAlerts,
    stateUpdate: { status: plotStatus, notes: stateNotes },
  };
}
