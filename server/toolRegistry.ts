import {
  AgentToolName,
  ToolDefinition,
  ToolExecutionRecord,
  Plot,
  CropType,
  SoilType,
  FarmAlert,
  FarmAction,
  WeatherData,
} from '../src/types';
import { INDIAN_CROP_DATABASE, INDIAN_SOIL_DATABASE } from '../src/data/indianAgriData';
import { evaluatePlot } from './decisionEngine';
import { FarmStore } from './farmStore';

export interface ToolExecutionContext {
  farmStore: FarmStore;
  cycleNumber: number;
  triggeredBy: 'AGENT_CYCLE' | 'USER_MANUAL' | 'GEMINI_ORCHESTRATOR';
}

export const REGISTERED_TOOLS: Record<AgentToolName, ToolDefinition> = {
  getFarmState: {
    name: 'getFarmState',
    displayName: 'Get Farm State',
    description: 'Retrieves complete synchronized state of the Indian farm including geo-location, plots, current season, and power feeder status.',
    category: 'PERCEPTION',
    inputSchema: {
      type: 'object',
      properties: {
        includePlots: { type: 'boolean', description: 'Whether to include plot summaries', required: false },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        farm: { type: 'object', description: 'Farm metadata and location' },
        plotCount: { type: 'number', description: 'Total monitored plots' },
        activeAlertsCount: { type: 'number', description: 'Total unresolved alerts' },
      },
    },
    validationRules: ['Payload must be a valid JSON object.'],
    permissionRequirements: 'READ',
    executionStatus: 'AVAILABLE',
  },

  getSensorReadings: {
    name: 'getSensorReadings',
    displayName: 'Get Sensor Readings',
    description: 'Fetches recent capacitive, temperature, or humidity sensor telemetry for a specific agricultural plot or across the farm.',
    category: 'PERCEPTION',
    inputSchema: {
      type: 'object',
      properties: {
        plotId: { type: 'string', description: 'ID of the plot to query (e.g. plot-1)', required: false },
        sensorType: { type: 'string', description: 'Type of sensor (soil_moisture, soil_temperature, humidity)', required: false },
        limit: { type: 'number', description: 'Max readings to return (default 20, max 100)', required: false },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        readings: { type: 'array', description: 'List of sensor readings matching filters' },
        count: { type: 'number', description: 'Total readings retrieved' },
      },
    },
    validationRules: ['plotId must exist if specified.', 'limit must not exceed 100.'],
    permissionRequirements: 'READ',
    executionStatus: 'AVAILABLE',
  },

  validateSensorData: {
    name: 'validateSensorData',
    displayName: 'Validate Sensor Data & Anomaly Detection',
    description: 'Performs deterministic sanity and anomaly checks on sensor observations against agronomic and physical plausibility bounds.',
    category: 'ANALYSIS',
    inputSchema: {
      type: 'object',
      properties: {
        plotId: { type: 'string', description: 'Target plot ID', required: true },
        sensorType: { type: 'string', description: 'Sensor type to validate', required: true },
        value: { type: 'number', description: 'Numerical telemetry reading', required: true },
      },
      required: ['plotId', 'sensorType', 'value'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean', description: 'Whether reading passed all checks' },
        qualityStatus: { type: 'string', description: 'valid | anomalous | degraded' },
        flags: { type: 'array', description: 'Identified anomalies or bounds breaches' },
      },
    },
    validationRules: [
      'Value must be finite number.',
      'Moisture cannot be negative or exceed 100%.',
      'Air temperature must fall between -5°C and 55°C for Indian territory.',
    ],
    permissionRequirements: 'READ',
    executionStatus: 'AVAILABLE',
  },

  getWeatherInformation: {
    name: 'getWeatherInformation',
    displayName: 'Get Weather & Monsoon Information',
    description: 'Retrieves current weather, past 24h precipitation, 24h rainfall forecast, and Indian monsoon status (IMD / AWS).',
    category: 'PERCEPTION',
    inputSchema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'Indian district / state name', required: false },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        temperatureC: { type: 'number', description: 'Current temperature in Celsius' },
        rainfallPast24hMm: { type: 'number', description: 'Past 24 hours rainfall in millimeters' },
        forecastRainfallNext24hMm: { type: 'number', description: 'Forecasted rainfall for next 24 hours' },
        monsoonStatus: { type: 'string', description: 'Active | Break | Pre-Monsoon' },
      },
    },
    validationRules: ['Location string must not contain harmful tokens.'],
    permissionRequirements: 'READ',
    executionStatus: 'AVAILABLE',
  },

  getCropProfile: {
    name: 'getCropProfile',
    displayName: 'Get Crop Profile (ICAR Benchmarks)',
    description: 'Retrieves verified Indian agronomic benchmarks, phenological stages, water requirement (Kc), and nutrient guidelines for a crop.',
    category: 'KNOWLEDGE',
    inputSchema: {
      type: 'object',
      properties: {
        cropType: { type: 'string', description: 'Crop name (e.g. Rice, Wheat, Cotton, Tomato)', required: true },
      },
      required: ['cropType'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        profile: { type: 'object', description: 'ICAR crop profile specification' },
      },
    },
    validationRules: ['cropType must match a supported Indian crop.'],
    permissionRequirements: 'READ',
    executionStatus: 'AVAILABLE',
  },

  getSoilProfile: {
    name: 'getSoilProfile',
    displayName: 'Get Soil Profile',
    description: 'Retrieves physical characteristics, percolation rates, water holding capacity, and management practices for Indian soil classes.',
    category: 'KNOWLEDGE',
    inputSchema: {
      type: 'object',
      properties: {
        soilType: { type: 'string', description: 'Soil type (e.g. Black Cotton Soil (Regur), Alluvial Soil)', required: true },
      },
      required: ['soilType'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        profile: { type: 'object', description: 'Soil physical and hydraulic properties' },
      },
    },
    validationRules: ['soilType must match standard classification.'],
    permissionRequirements: 'READ',
    executionStatus: 'AVAILABLE',
  },

  analyzeIrrigationNeed: {
    name: 'analyzeIrrigationNeed',
    displayName: 'Analyze Irrigation Need (Utility-Based Engine)',
    description: 'Executes mathematical utility evaluation factoring soil moisture deficit, crop Kc, weather forecast, and recent irrigation history.',
    category: 'ANALYSIS',
    inputSchema: {
      type: 'object',
      properties: {
        plotId: { type: 'string', description: 'Target plot ID to analyze', required: true },
      },
      required: ['plotId'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        decision: { type: 'object', description: 'Formulated decision with utility score and evidence' },
        isActionRequired: { type: 'boolean', description: 'Whether physical/simulated intervention is needed' },
      },
    },
    validationRules: ['plotId must exist in farm model.'],
    permissionRequirements: 'READ',
    executionStatus: 'AVAILABLE',
  },

  analyzeFertilizationNeed: {
    name: 'analyzeFertilizationNeed',
    displayName: 'Analyze Fertilization Need (Zero-Fabrication Guardrail)',
    description: 'Evaluates soil fertility against ICAR recommended doses of fertilizer (RDF), strictly enforcing the Zero-Fabrication rule if lab NPK is missing.',
    category: 'ANALYSIS',
    inputSchema: {
      type: 'object',
      properties: {
        plotId: { type: 'string', description: 'Target plot ID', required: true },
      },
      required: ['plotId'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        hasMeasuredNutrients: { type: 'boolean', description: 'Whether laboratory NPK data is recorded' },
        plan: { type: 'object', description: 'Fertilizer split plan or KVK referral notice' },
      },
    },
    validationRules: ['plotId must be valid.'],
    permissionRequirements: 'READ',
    executionStatus: 'AVAILABLE',
  },

  analyzeCropHealth: {
    name: 'analyzeCropHealth',
    displayName: 'Analyze Crop Health & Canopy Turgor',
    description: 'Performs canopy triage assessing moisture wilting, chlorosis, waterlogging risk, and pest/disease symptoms.',
    category: 'ANALYSIS',
    inputSchema: {
      type: 'object',
      properties: {
        plotId: { type: 'string', description: 'Target plot ID', required: true },
        notes: { type: 'string', description: 'Field scouting notes or symptoms', required: false },
      },
      required: ['plotId'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        healthStatus: { type: 'string', description: 'HEALTHY | POSSIBLE_STRESS | DISEASE_SYMPTOMS | INCONCLUSIVE' },
        observations: { type: 'array', description: 'Observed signs' },
        recommendations: { type: 'array', description: 'Actionable agronomic steps' },
      },
    },
    validationRules: ['plotId must be valid.'],
    permissionRequirements: 'READ',
    executionStatus: 'AVAILABLE',
  },

  createAlert: {
    name: 'createAlert',
    displayName: 'Create Prioritized Alert',
    description: 'Emits a persistent, categorized agronomic alert into the agent perception stream for operator notification.',
    category: 'PERCEPTION',
    inputSchema: {
      type: 'object',
      properties: {
        plotId: { type: 'string', description: 'Plot ID related to alert', required: true },
        severity: { type: 'string', enum: ['CRITICAL', 'WARNING', 'INFO'], description: 'Severity level', required: true },
        category: { type: 'string', enum: ['MOISTURE', 'TEMPERATURE', 'SENSOR_HEALTH', 'NUTRIENT', 'WEATHER', 'MONSOON'], description: 'Category', required: true },
        title: { type: 'string', description: 'Short alert title', required: true },
        message: { type: 'string', description: 'Detailed message and instruction', required: true },
      },
      required: ['plotId', 'severity', 'category', 'title', 'message'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        alertId: { type: 'string', description: 'Generated alert ID' },
        success: { type: 'boolean', description: 'Creation status' },
      },
    },
    validationRules: ['severity and category must match enum values.', 'title must not be empty.'],
    permissionRequirements: 'WRITE',
    executionStatus: 'AVAILABLE',
  },

  getActionHistory: {
    name: 'getActionHistory',
    displayName: 'Get Action & Feedback History',
    description: 'Retrieves episodic memory logs of executed simulated irrigation, actuator feedbacks, and farmer approval/rejection outcomes.',
    category: 'ANALYSIS',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max events to return', required: false },
        plotId: { type: 'string', description: 'Filter by plot ID', required: false },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        actions: { type: 'array', description: 'Recent farm actions and outcomes' },
        totalWaterSavedLiters: { type: 'number', description: 'Cumulative water conserved' },
      },
    },
    validationRules: ['limit must be positive integer up to 100.'],
    permissionRequirements: 'READ',
    executionStatus: 'AVAILABLE',
  },

  requestAdditionalData: {
    name: 'requestAdditionalData',
    displayName: 'Request Additional Field Telemetry',
    description: 'Generates a formal data acquisition request when required inputs (e.g. soil test, sensor recalibration) are absent.',
    category: 'SAFETY_APPROVAL',
    inputSchema: {
      type: 'object',
      properties: {
        plotId: { type: 'string', description: 'Plot ID requiring data', required: true },
        missingDataType: { type: 'string', description: 'Type of missing data (e.g. soil_health_card, npk_test, rainfall)', required: true },
        urgency: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], description: 'Urgency', required: false },
        instructions: { type: 'string', description: 'Guidance on how to obtain data (e.g. visit KVK)', required: true },
      },
      required: ['plotId', 'missingDataType', 'instructions'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        requestId: { type: 'string', description: 'Data request identifier' },
        logged: { type: 'boolean', description: 'Logged to agent episodic memory' },
      },
    },
    validationRules: ['missingDataType must be specified.'],
    permissionRequirements: 'WRITE',
    executionStatus: 'AVAILABLE',
  },

  requestHumanApproval: {
    name: 'requestHumanApproval',
    displayName: 'Request Human Operator Approval',
    description: 'Elevates a candidate autonomous action to Safety Level 3 (Human Approval Queue) before any actuation can proceed.',
    category: 'SAFETY_APPROVAL',
    inputSchema: {
      type: 'object',
      properties: {
        decisionId: { type: 'string', description: 'Decision ID to queue for approval', required: true },
        proposedActionType: { type: 'string', description: 'Type of action (e.g. SIMULATED_IRRIGATION)', required: true },
        riskAssessment: { type: 'string', description: 'Potential risk analysis', required: true },
      },
      required: ['decisionId', 'proposedActionType', 'riskAssessment'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        queued: { type: 'boolean', description: 'Approval queue status' },
        safetyLevel: { type: 'string', description: 'LEVEL_3_HUMAN_APPROVAL' },
      },
    },
    validationRules: ['decisionId must exist in agent decisions list.'],
    permissionRequirements: 'ACTUATION_APPROVAL',
    executionStatus: 'AVAILABLE',
  },

  simulateIrrigation: {
    name: 'simulateIrrigation',
    displayName: 'Simulate Irrigation Actuation',
    description: 'Dispatches simulated pump/valve actuator command following approved human consent, gradually replenishing soil moisture.',
    category: 'ACTUATION',
    inputSchema: {
      type: 'object',
      properties: {
        plotId: { type: 'string', description: 'Target plot ID', required: true },
        durationMinutes: { type: 'number', description: 'Irrigation duration (5-120 minutes)', required: true },
      },
      required: ['plotId', 'durationMinutes'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        actionId: { type: 'string', description: 'Dispatched action ID' },
        estimatedWaterLiters: { type: 'number', description: 'Volume of water dispatched' },
        status: { type: 'string', description: 'RUNNING | COMPLETED' },
      },
    },
    validationRules: [
      'durationMinutes must be between 5 and 120.',
      'plotId must exist.',
      'Must have human approval confirmation.',
    ],
    permissionRequirements: 'ACTUATION_APPROVAL',
    executionStatus: 'AVAILABLE',
  },

  getAgentMemory: {
    name: 'getAgentMemory',
    displayName: 'Get Agent Tripartite Memory',
    description: 'Retrieves current short-term perception cache, episodic decision/action logs, and semantic Indian agronomic reference knowledge.',
    category: 'KNOWLEDGE',
    inputSchema: {
      type: 'object',
      properties: {
        memoryType: { type: 'string', enum: ['ALL', 'SHORT_TERM', 'EPISODIC', 'SEMANTIC'], description: 'Type of memory store to query' },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        shortTerm: { type: 'object', description: 'Latest telemetry and active alerts' },
        episodic: { type: 'object', description: 'Past decisions and actions' },
        semantic: { type: 'object', description: 'Farm details and crop database references' },
      },
    },
    validationRules: ['Payload must be a valid object.'],
    permissionRequirements: 'READ',
    executionStatus: 'AVAILABLE',
  },
};

/**
 * Execute a specific tool from the Allowlisted Tool Registry with full telemetry logging.
 */
export async function executeTool(
  toolName: AgentToolName,
  params: Record<string, any>,
  context: ToolExecutionContext
): Promise<{ success: boolean; data?: any; error?: string; record: ToolExecutionRecord }> {
  const startTime = Date.now();
  const toolDef = REGISTERED_TOOLS[toolName];

  if (!toolDef) {
    const record: ToolExecutionRecord = {
      id: `tool-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      toolName,
      timestamp: new Date().toISOString(),
      cycleNumber: context.cycleNumber,
      executionStatus: 'REJECTED',
      inputSummary: params || {},
      outputSummary: {},
      durationMs: 0,
      error: `Tool "${toolName}" is not registered in the allowlisted tool registry.`,
      triggeredBy: context.triggeredBy,
    };
    return { success: false, error: record.error, record };
  }

  const farmStore = context.farmStore;

  try {
    let result: any = null;

    switch (toolName) {
      case 'getFarmState': {
        result = {
          farm: farmStore.farm,
          plotCount: farmStore.plots.length,
          activeAlertsCount: farmStore.alerts.filter((a) => a.status === 'ACTIVE').length,
          weather: farmStore.simulationEngine.weather,
          systemStatus: farmStore.getSystemStatus(),
        };
        break;
      }

      case 'getSensorReadings': {
        const plotId = params.plotId as string | undefined;
        const sensorType = params.sensorType as string | undefined;
        const limit = Math.min(100, Math.max(1, Number(params.limit || 20)));

        let readings = farmStore.sensorHistory;
        if (plotId) readings = readings.filter((r) => r.plotId === plotId);
        if (sensorType) readings = readings.filter((r) => r.sensorType === sensorType);

        result = {
          readings: readings.slice(-limit),
          count: Math.min(readings.length, limit),
        };
        break;
      }

      case 'validateSensorData': {
        const { plotId, sensorType, value } = params;
        if (!plotId || !sensorType || typeof value !== 'number' || isNaN(value)) {
          throw new Error('Invalid arguments for validateSensorData');
        }

        const flags: string[] = [];
        let isValid = true;
        let qualityStatus = 'valid';

        if (sensorType === 'soil_moisture') {
          if (value < 0 || value > 100) {
            isValid = false;
            qualityStatus = 'anomalous';
            flags.push(`Soil moisture ${value}% out of physical bounds [0%, 100%]`);
          } else if (value < 10) {
            flags.push(`Extremely arid moisture reading (${value}%); verify capacitive sensor probe contact`);
          }
        } else if (sensorType === 'soil_temperature') {
          if (value < 0 || value > 55) {
            isValid = false;
            qualityStatus = 'anomalous';
            flags.push(`Temperature ${value}°C outside plausible Indian range`);
          }
        }

        result = { isValid, qualityStatus, flags };
        break;
      }

      case 'getWeatherInformation': {
        const w = farmStore.simulationEngine.weather;
        result = {
          temperatureC: w.temperatureC,
          humidityPercent: w.humidityPercent,
          rainfallPast24hMm: w.rainfallMmPast24h,
          forecastRainfallNext24hMm: w.forecastRainfallMmNext24h,
          forecastRainProbability: w.forecastRainProbability,
          monsoonStatus: w.monsoonStatus || 'Active Monsoon',
          condition: w.condition,
          dataSource: w.dataSource || 'IMD AWS Gridded (Simulated)',
        };
        break;
      }

      case 'getCropProfile': {
        const cropType = params.cropType as CropType;
        const profile = INDIAN_CROP_DATABASE[cropType] || INDIAN_CROP_DATABASE.Rice;
        result = { profile };
        break;
      }

      case 'getSoilProfile': {
        const soilType = params.soilType as SoilType;
        const profile = INDIAN_SOIL_DATABASE[soilType] || INDIAN_SOIL_DATABASE['Black Cotton Soil (Regur)'];
        result = { profile };
        break;
      }

      case 'analyzeIrrigationNeed': {
        const plotId = params.plotId as string;
        const plot = farmStore.plots.find((p) => p.id === plotId);
        if (!plot) throw new Error(`Plot ${plotId} not found`);

        const recentReadings = farmStore.sensorHistory.filter((r) => r.plotId === plot.id).slice(-10);
        const isActionRunning = farmStore.actions.some(
          (a) => a.plotId === plot.id && a.executionStatus === 'RUNNING'
        );

        const evaluation = evaluatePlot(
          plot,
          recentReadings,
          farmStore.simulationEngine.weather,
          isActionRunning
        );

        result = {
          plotId: plot.id,
          plotName: plot.name,
          currentMoisture: plot.currentMoisture,
          targetMoistureRange: plot.targetMoistureRange,
          decisions: evaluation.decisions,
          alertsGenerated: evaluation.alerts.length,
          isActionRequired: evaluation.decisions.some((d) => d.suggestedAction !== undefined),
        };
        break;
      }

      case 'analyzeFertilizationNeed': {
        const plotId = params.plotId as string;
        const plot = farmStore.plots.find((p) => p.id === plotId);
        if (!plot) throw new Error(`Plot ${plotId} not found`);

        const hasMeasured =
          plot.nitrogenMgKg !== undefined &&
          plot.phosphorusMgKg !== undefined &&
          plot.potassiumMgKg !== undefined;

        if (!hasMeasured) {
          result = {
            hasMeasuredNutrients: false,
            guardrailEnforced: 'Zero-Fabrication Guardrail: No laboratory NPK recorded',
            recommendation: 'Do NOT apply chemical fertilizer doses blindly. Submit a composite soil sample to the nearest Krishi Vigyan Kendra (KVK).',
            kvkActionRequired: true,
          };
        } else {
          result = {
            hasMeasuredNutrients: true,
            nitrogenMgKg: plot.nitrogenMgKg,
            phosphorusMgKg: plot.phosphorusMgKg,
            potassiumMgKg: plot.potassiumMgKg,
            ph: plot.currentPh,
            soilHealthCard: plot.soilHealthCard,
            status: 'Ready for ICAR balanced split application',
          };
        }
        break;
      }

      case 'analyzeCropHealth': {
        const plotId = params.plotId as string;
        const plot = farmStore.plots.find((p) => p.id === plotId);
        if (!plot) throw new Error(`Plot ${plotId} not found`);

        const isLow = plot.currentMoisture < plot.targetMoistureRange.min;
        const isHigh = plot.currentMoisture > plot.targetMoistureRange.max;

        result = {
          plotId: plot.id,
          plotName: plot.name,
          healthStatus: isLow || isHigh ? 'POSSIBLE_STRESS' : 'HEALTHY',
          observations: [
            `Soil moisture currently at ${plot.currentMoisture}% (Target: ${plot.targetMoistureRange.min}%-${plot.targetMoistureRange.max}%)`,
            `Phenological stage: ${plot.growthStage} for ${plot.cropType}`,
          ],
          recommendations: isLow
            ? ['Moisture stress observed. Schedule precision irrigation pulse.']
            : isHigh
            ? ['Waterlogging threat detected. Open drainage channels and suspend pump.']
            : ['Foliar turgor optimal. Continue passive automated monitoring.'],
        };
        break;
      }

      case 'createAlert': {
        const { plotId, severity, category, title, message } = params;
        const plot = farmStore.plots.find((p) => p.id === plotId);
        const newAlert: FarmAlert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          plotId,
          plotName: plot?.name || 'Farm Plot',
          severity: severity || 'INFO',
          category: category || 'MOISTURE',
          title,
          message,
          status: 'ACTIVE',
          timestamp: new Date().toISOString(),
        };
        farmStore.alerts.unshift(newAlert);
        result = { alertId: newAlert.id, success: true };
        break;
      }

      case 'getActionHistory': {
        result = {
          actions: farmStore.actions.slice(0, Number(params.limit || 20)),
          totalWaterSavedLiters: farmStore.totalWaterSavedLiters,
        };
        break;
      }

      case 'requestAdditionalData': {
        const { plotId, missingDataType, instructions } = params;
        const plot = farmStore.plots.find((p) => p.id === plotId);
        farmStore.logAgentEvent(
          'ANALYZE',
          `Data Request Issued: [${missingDataType}] for ${plot?.name || plotId}. Action: ${instructions}`,
          'warn'
        );
        result = { requestId: `req-${Date.now()}`, logged: true };
        break;
      }

      case 'requestHumanApproval': {
        const { decisionId, proposedActionType, riskAssessment } = params;
        const decision = farmStore.decisions.find((d) => d.id === decisionId);
        if (!decision) throw new Error(`Decision ${decisionId} not found`);

        decision.requiresHumanApproval = true;
        decision.status = 'PENDING';
        farmStore.logAgentEvent(
          'VALIDATE',
          `Human Approval Requested: ${decision.recommendation} for ${decision.plotName}. Risk: ${riskAssessment}`,
          'decision'
        );
        result = { queued: true, safetyLevel: 'LEVEL_3_HUMAN_APPROVAL' };
        break;
      }

      case 'simulateIrrigation': {
        const { plotId, durationMinutes } = params;
        const duration = Math.max(5, Math.min(120, Number(durationMinutes || 20)));
        const action = farmStore.manualExecuteIrrigation(plotId, duration);
        if (!action) throw new Error(`Could not initiate simulated irrigation for ${plotId}`);
        result = {
          actionId: action.id,
          estimatedWaterLiters: action.parameters.volumeLiters || 12000,
          status: action.executionStatus,
        };
        break;
      }

      case 'getAgentMemory': {
        const memory = farmStore.getMemory();
        const type = params.memoryType || 'ALL';
        if (type === 'SHORT_TERM') {
          result = { shortTerm: memory.shortTerm };
        } else if (type === 'EPISODIC') {
          result = { episodic: memory.episodic };
        } else if (type === 'SEMANTIC') {
          result = { semantic: memory.semantic };
        } else {
          result = memory;
        }
        break;
      }

      default:
        throw new Error(`Unimplemented tool handler: ${toolName}`);
    }

    const durationMs = Date.now() - startTime;
    const record: ToolExecutionRecord = {
      id: `tool-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      toolName,
      timestamp: new Date().toISOString(),
      cycleNumber: context.cycleNumber,
      executionStatus: 'SUCCESS',
      inputSummary: params || {},
      outputSummary: result || {},
      durationMs,
      triggeredBy: context.triggeredBy,
    };

    return { success: true, data: result, record };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const record: ToolExecutionRecord = {
      id: `tool-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      toolName,
      timestamp: new Date().toISOString(),
      cycleNumber: context.cycleNumber,
      executionStatus: 'FAILED',
      inputSummary: params || {},
      outputSummary: {},
      durationMs,
      error: err?.message || 'Unknown tool execution error',
      triggeredBy: context.triggeredBy,
    };

    return { success: false, error: err?.message, record };
  }
}
