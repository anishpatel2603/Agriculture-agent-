export type Language = 'en' | 'hi' | 'mr';
export type SupportedLanguage = Language;

export type Theme = 'light' | 'dark';

export type UnitSystem = 'acre' | 'hectare';

export type CroppingSeason = 'Kharif' | 'Rabi' | 'Zaid' | 'Perennial';

export type CropCategory =
  | 'Cereals & Millets'
  | 'Pulses'
  | 'Oilseeds'
  | 'Commercial & Cash Crops'
  | 'Vegetables'
  | 'Fruits & Plantation';

export type CropType =
  // Cereals & Millets
  | 'Rice'
  | 'Wheat'
  | 'Maize'
  | 'Jowar (Sorghum)'
  | 'Bajra (Pearl Millet)'
  | 'Ragi (Finger Millet)'
  // Pulses
  | 'Chickpea (Chana)'
  | 'Pigeon Pea (Tur / Arhar)'
  | 'Green Gram (Moong)'
  | 'Black Gram (Urad)'
  | 'Lentil (Masoor)'
  // Oilseeds
  | 'Groundnut'
  | 'Soybean'
  | 'Mustard'
  | 'Sunflower'
  | 'Sesame (Til)'
  // Cash Crops
  | 'Cotton'
  | 'Sugarcane'
  | 'Tea'
  | 'Coffee'
  // Horticulture / Vegetables & Fruits
  | 'Onion'
  | 'Potato'
  | 'Tomato'
  | 'Chilli'
  | 'Brinjal'
  | 'Okra (Bhindi)'
  | 'Banana'
  | 'Mango'
  | 'Grapes'
  | 'Pomegranate'
  | 'Coconut'
  | 'Lettuce'
  | 'Custom';

export type GrowthStage =
  | 'Germination'
  | 'Vegetative'
  | 'Tillering'
  | 'Crown Root Initiation (CRI)'
  | 'Square Formation'
  | 'Flowering'
  | 'Boll Formation / Pod Filling'
  | 'Fruit Development'
  | 'Grain Filling'
  | 'Maturation'
  | 'Maturation / Harvest';

export type SoilType =
  | 'Alluvial Soil'
  | 'Black Cotton Soil (Regur)'
  | 'Red & Yellow Soil'
  | 'Laterite Soil'
  | 'Arid & Desert Soil'
  | 'Mountain & Forest Soil'
  | 'Loam'
  | 'Clay'
  | 'Sandy Loam'
  | 'Silt Loam'
  | 'Sandy'
  | 'Unknown / Not Tested';

export type IrrigationMethod =
  | 'Drip Irrigation'
  | 'Sprinkler'
  | 'Micro-Sprinkler'
  | 'Raingun Sprinkler'
  | 'Flood Irrigation'
  | 'Flood / Basin'
  | 'Furrow'
  | 'Furrow Irrigation'
  | 'Border Strip'
  | 'Rainfed Agriculture'
  | 'Manual / Hose Watering'
  | 'Subsurface Drip';

export type WaterSource =
  | 'Borewell / Tube Well'
  | 'Canal Irrigation'
  | 'Canal Water (नहर)'
  | 'Farm Pond (Shet-tale / Khet Talab)'
  | 'Farm Pond (शेततळे)'
  | 'Open Dug Well'
  | 'River / Stream Lift'
  | 'River Lift Irrigation'
  | 'Rainfed Only';

export interface Farm {
  id: string;
  name: string;
  country: string; // "India"
  state: string; // "Maharashtra"
  district: string; // "Thane"
  talukaOrVillage: string; // "Airoli"
  location: string;
  latitude?: number;
  longitude?: number;
  agroClimaticZone?: string;
  totalAreaHa: number;
  totalAreaAcre: number;
  currentSeason: CroppingSeason;
  season?: CroppingSeason;
  dataSource: string; // "IMD Gridded / Local Station Simulation"
  powerPhaseAvailability?: '3-Phase Active' | '3-Phase ON' | 'Load Shedding' | 'Single Phase' | '1-Phase (Household)' | 'Power Cut';
  createdAt: string;
}

export interface MoistureRange {
  min: number; // percentage, e.g. 35%
  optimal: number; // e.g. 55%
  max: number; // e.g. 75%
}

export interface SoilHealthCardData {
  hasCard: boolean;
  sampleId?: string;
  testDate?: string;
  testingLab?: string; // e.g. "KVK Thane Soil Testing Lab"
  ph?: number;
  ecDsM?: number; // Electrical conductivity dS/m
  electricalConductivityDsM?: number; // Alias for ecDsM
  organicCarbonPercent?: number; // <0.5 Low, 0.5-0.75 Medium, >0.75 High
  availableNitrogenKgHa?: number; // <280 Low, 280-560 Med, >560 High
  availablePhosphorusKgHa?: number; // <10 Low, 10-25 Med, >25 High
  availablePotassiumKgHa?: number; // <108 Low, 108-280 Med, >280 High
  sulphurPpm?: number;
  zincPpm?: number;
  boronPpm?: number;
  ironPpm?: number;
  notes?: string;
}

export interface Plot {
  id: string;
  farmId: string;
  name: string;
  areaHa: number;
  areaAcre: number;
  cropType: CropType;
  growthStage: GrowthStage;
  season: CroppingSeason;
  soilType: SoilType;
  irrigationMethod: IrrigationMethod;
  waterSource: WaterSource;
  targetMoistureRange: MoistureRange;
  currentMoisture: number;
  currentTemp: number;
  currentHumidity: number;
  currentPh?: number;
  nitrogenMgKg?: number;
  phosphorusMgKg?: number;
  potassiumMgKg?: number;
  organicCarbonPercent?: number;
  electricalConductivityDsM?: number;
  soilHealthCard?: SoilHealthCardData;
  status: 'OPTIMAL' | 'ATTENTION_NEEDED' | 'CRITICAL' | 'SENSOR_ANOMALY';
  lastIrrigationTime?: string;
  lastReadingTime: string;
  createdAt: string;
}

export type SensorType =
  | 'soil_moisture'
  | 'soil_temperature'
  | 'air_temperature'
  | 'humidity'
  | 'rainfall'
  | 'soil_ph'
  | 'nitrogen'
  | 'phosphorus'
  | 'potassium';

export type SensorSource = 'simulated' | 'manual' | 'external_api' | 'iot_hardware';

export type QualityStatus = 'valid' | 'stale' | 'anomalous' | 'missing';

export interface SensorReading {
  id: string;
  plotId: string;
  sensorType: SensorType;
  value: number;
  unit: string;
  timestamp: string;
  source: SensorSource;
  qualityStatus: QualityStatus;
  notes?: string;
}

export type DecisionType = 'IRRIGATION' | 'FERTILIZATION' | 'CROP_HEALTH' | 'MONITORING';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DecisionEvidence {
  factor: string;
  value: string | number;
  unit?: string;
  interpretation: string;
  impactScore?: number; // e.g. -5 to +5 utility effect
}

export interface AgentDecision {
  id: string;
  plotId: string;
  plotName?: string;
  decisionType: DecisionType;
  recommendation:
    | 'RECOMMEND_IRRIGATION'
    | 'CONTINUE_MONITORING'
    | 'DEFER_IRRIGATION_RAIN'
    | 'WARNING_EXCESSIVE_MOISTURE'
    | 'SENSOR_INSPECTION_REQUIRED'
    | 'SOIL_TEST_RECOMMENDED'
    | 'APPLY_FERTILIZER_GUIDANCE'
    | 'HEAT_STRESS_PRECAUTION';
  priority: PriorityLevel;
  confidence: number; // 0.0 to 1.0
  reason: string;
  evidence: DecisionEvidence[];
  suggestedAction?: {
    type:
      | 'SIMULATED_IRRIGATION'
      | 'VALVE_CONTROL'
      | 'PUMP_SHUTDOWN'
      | 'SOIL_TEST_DISPATCH'
      | 'INSPECTION_ALERT';
    durationMinutes?: number;
    volumeLiters?: number;
    volumeLitersPerAcre?: number;
    fertilizerDose?: {
      ureaKgAcre?: number;
      dapKgAcre?: number;
      mopKgAcre?: number;
      fymTonnesAcre?: number;
      biofertilizerNote?: string;
    };
    parameters?: Record<string, any>;
  };
  requiresHumanApproval: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  executionNotes?: string;
  aiEnhanced?: boolean;
  aiExplanation?: string;
  createdAt: string;
}

export interface FarmAction {
  id: string;
  plotId: string;
  plotName: string;
  actionType: 'SIMULATED_IRRIGATION' | 'VALVE_CONTROL' | 'PUMP_SHUTDOWN' | 'INSPECTION_REQUEST';
  parameters: {
    durationMinutes: number;
    targetMoisturePercent?: number;
    rateLitersPerMin?: number;
    [key: string]: any;
  };
  approvalStatus: 'APPROVED' | 'REJECTED' | 'PENDING';
  executionStatus: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  progressPercent: number;
  startedAt?: string;
  completedAt?: string;
  initialMoisture: number;
  finalMoisture?: number;
  waterSavedEstLiters?: number;
  feedbackSummary?: string;
  createdAt: string;
}

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface FarmAlert {
  id: string;
  plotId: string;
  plotName: string;
  severity: AlertSeverity;
  category: 'MOISTURE' | 'TEMPERATURE' | 'SENSOR_HEALTH' | 'NUTRIENT' | 'WEATHER' | 'MONSOON';
  title: string;
  message: string;
  status: AlertStatus;
  timestamp: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface CropHealthAnalysis {
  id: string;
  plotId: string;
  plotName: string;
  healthStatus: 'HEALTHY' | 'POSSIBLE_STRESS' | 'DISEASE_SYMPTOMS' | 'INCONCLUSIVE';
  observations: string[];
  possibleCauses: string[];
  recommendedNextSteps: string[];
  confidence: number;
  disclaimer: string;
  imageUrl?: string;
  sampleName?: string;
  language?: Language;
  analyzedAt: string;
  modelUsed: string;
}

export interface AgentLogEntry {
  id: string;
  timestamp: string;
  cycle: number;
  stage: 'PERCEIVE' | 'UPDATE_STATE' | 'ANALYZE' | 'PLAN' | 'VALIDATE' | 'ACT' | 'FEEDBACK';
  message: string;
  details?: Record<string, any>;
  level: 'info' | 'warn' | 'decision' | 'action';
}

export interface WeatherData {
  temperatureC: number;
  humidityPercent: number;
  rainfallMmPast24h: number;
  forecastRainfallMmNext24h: number;
  forecastRainProbability: number;
  windSpeedKmh: number;
  solarRadiationWm2: number;
  condition: 'Sunny' | 'Partly Cloudy' | 'Overcast' | 'Light Rain' | 'Heavy Rain' | 'Clear Night';
  monsoonStatus?: 'Active Monsoon' | 'Break Monsoon' | 'Pre-Monsoon' | 'Post-Monsoon' | 'Dry Winter';
  dataSource?: string; // "IMD AWS / Simulation"
  lastUpdated: string;
  isSimulated: boolean;
}

export interface AgentSystemStatus {
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  currentCycle: number;
  currentStage: 'PERCEIVE' | 'UPDATE_STATE' | 'ANALYZE' | 'PLAN' | 'VALIDATE' | 'ACT' | 'FEEDBACK' | 'IDLE';
  simulationSpeed: number; // 1x, 2x, 5x, 10x
  lastCycleTimestamp: string;
  isSimulating: boolean;
  geminiAvailable: boolean;
  activePlotsCount: number;
  pendingActionsCount: number;
  activeAlertsCount: number;
  waterSavedTotalLiters: number;
  powerFeederStatus?: '3-Phase ON' | '3-Phase Active' | 'Single Phase' | 'Load Shedding';
  currentTask?: string;
  lastObservation?: string;
  lastDecision?: string;
  errorStatus?: string | null;
  executionMode?: 'SIMULATION_APPROVAL' | 'AUTONOMOUS' | 'PAUSED';
  totalToolCallsCount?: number;
}

export type AgentToolName =
  | 'getFarmState'
  | 'getSensorReadings'
  | 'validateSensorData'
  | 'getWeatherInformation'
  | 'getCropProfile'
  | 'getSoilProfile'
  | 'analyzeIrrigationNeed'
  | 'analyzeFertilizationNeed'
  | 'analyzeCropHealth'
  | 'createAlert'
  | 'getActionHistory'
  | 'requestAdditionalData'
  | 'requestHumanApproval'
  | 'simulateIrrigation'
  | 'getAgentMemory';

export type UserIntent =
  | 'GENERAL_AGENT_INFO'
  | 'FARM_STATUS'
  | 'SENSOR_ANALYSIS'
  | 'IRRIGATION_DECISION'
  | 'FERTILIZATION_ANALYSIS'
  | 'CROP_HEALTH'
  | 'WEATHER_QUERY'
  | 'ACTION_HISTORY'
  | 'MEMORY_QUERY'
  | 'SIMULATION_ACTION'
  | 'UNKNOWN_OR_UNSUPPORTED';

export interface IntentEntities {
  plotId?: string;
  plotName?: string;
  crop?: string;
  growthStage?: string;
  location?: string;
  sensorType?: string;
  actionType?: string;
  scenarioId?: string;
  queryTopic?: string;
}

export interface IntentClassificationResult {
  intent: UserIntent;
  confidence: number;
  entities: IntentEntities;
  required_tools: AgentToolName[];
  needs_farm_data: boolean;
  needs_clarification: boolean;
  clarification_question?: string;
}

export interface ConversationalChatResponse {
  reply: string;
  intent: UserIntent;
  intentConfidence: number;
  toolsUsed: string[];
  toolResults?: any[];
  source: string;
  dataSource: string;
  timestamp: string;
  warningOrUncertainty?: string;
  safetyLevel?: string;
  decision?: {
    recommendation?: string;
    priority?: PriorityLevel;
    confidence?: number;
    reason?: string;
  };
  suggestedQuestions: string[];
  conversationContext?: {
    plotId?: string;
    crop?: string;
    growthStage?: string;
    location?: string;
  };
}

export interface ToolDefinition {
  name: AgentToolName;
  displayName: string;
  description: string;
  category: 'PERCEPTION' | 'KNOWLEDGE' | 'ANALYSIS' | 'SAFETY_APPROVAL' | 'ACTUATION';
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[]; required?: boolean }>;
    required?: string[];
  };
  outputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
  };
  validationRules: string[];
  permissionRequirements: 'READ' | 'WRITE' | 'ACTUATION_APPROVAL';
  executionStatus: 'AVAILABLE' | 'RESTRICTED';
}

export interface ToolExecutionRecord {
  id: string;
  toolName: AgentToolName;
  timestamp: string;
  cycleNumber: number;
  executionStatus: 'SUCCESS' | 'FAILED' | 'REJECTED';
  inputSummary: Record<string, any>;
  outputSummary: Record<string, any>;
  durationMs: number;
  error?: string;
  triggeredBy: 'AGENT_CYCLE' | 'USER_MANUAL' | 'GEMINI_ORCHESTRATOR';
}

export interface ShortTermMemory {
  latestReadings: SensorReading[];
  activeAlerts: FarmAlert[];
  currentTask: string;
  currentActionStatus?: string;
  recentObservations: {
    plotId: string;
    plotName: string;
    observation: string;
    timestamp: string;
    qualityStatus: QualityStatus;
  }[];
}

export interface EpisodicMemory {
  previousDecisions: AgentDecision[];
  approvedActions: FarmAction[];
  rejectedActions: {
    decisionId: string;
    plotId: string;
    plotName: string;
    reason?: string;
    timestamp: string;
  }[];
  irrigationEvents: {
    id: string;
    plotId: string;
    plotName: string;
    timestamp: string;
    volumeLiters: number;
    initialMoisture: number;
    finalMoisture?: number;
    waterSavedEstLiters?: number;
  }[];
  feedbackEvents: {
    id: string;
    timestamp: string;
    plotName: string;
    actionType: string;
    outcome: string;
  }[];
}

export interface SemanticMemory {
  farmDetails: {
    name: string;
    country: string;
    state: string;
    district: string;
    talukaOrVillage: string;
    season: CroppingSeason;
    agroClimaticZone: string;
  };
  supportedCropsCount: number;
  soilProfilesCount: number;
  irrigationMethods: IrrigationMethod[];
  waterSources: WaterSource[];
  referenceStandards: string[];
  userPreferences: {
    defaultLanguage: Language;
    requireApprovalForLowPriority: boolean;
    autoLockoutOnRainfallMm: number;
  };
}

export interface AgentMemory {
  shortTerm: ShortTermMemory;
  episodic: EpisodicMemory;
  semantic: SemanticMemory;
}

export interface AgentPerformanceMetrics {
  cyclesCompleted: number;
  observationsProcessed: number;
  validReadingsCount: number;
  invalidReadingsCount: number;
  missingDataEventsCount: number;
  toolCallsCount: number;
  avgResponseTimeMs: number;
  recommendationsCount: number;
  approvedSimulationsCount: number;
  rejectedSimulationsCount: number;
  activeAlertsCount: number;
  waterSavedLitersTotal: number;
  uptimeSeconds: number;
}

export type SafetyActionLevel =
  | 'LEVEL_1_OBSERVATION'
  | 'LEVEL_2_RECOMMENDATION'
  | 'LEVEL_3_HUMAN_APPROVAL'
  | 'LEVEL_4_SIMULATED_EXECUTION'
  | 'LEVEL_5_REAL_HARDWARE';

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  targetPlotId: string;
  state?: string;
  season?: CroppingSeason;
  inputs: {
    soilMoisture: number;
    temperature: number;
    humidity: number;
    recentRainfallMm: number;
    forecastRainProbability: number;
    sensorStatus: QualityStatus;
    npkAvailable: boolean;
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
    waterSource?: WaterSource;
    irrigationMethod?: IrrigationMethod;
  };
  expectedDecision: string;
  expectedPriority: PriorityLevel;
  educationalTakeaway: string;
}
