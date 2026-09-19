import {
  Farm,
  Plot,
  SensorReading,
  AgentDecision,
  FarmAction,
  FarmAlert,
  AgentLogEntry,
  AgentSystemStatus,
  ScenarioDefinition,
  CropHealthAnalysis,
  SoilHealthCardData,
  CroppingSeason,
  AgentToolName,
  ToolExecutionRecord,
  AgentMemory,
  AgentPerformanceMetrics,
} from '../src/types';
import { evaluatePlot } from './decisionEngine';
import { SimulationEngine } from './simulationEngine';
import { isGeminiAvailable, explainDecisionWithAI, runAutonomousGeminiReasoning } from './geminiService';
import { executeTool, REGISTERED_TOOLS } from './toolRegistry';
import { INDIAN_CROP_DATABASE, INDIAN_SOIL_DATABASE } from '../src/data/indianAgriData';

export class FarmStore {
  public farm: Farm = {
    id: 'farm-in-01',
    name: 'AgroGenesis India Model Smart Farm (अग्रोजेनेसिस भारतीय मॉडेल शेत)',
    country: 'India',
    state: 'Maharashtra',
    district: 'Thane',
    talukaOrVillage: 'Airoli',
    location: 'Airoli Demonstration Station, Thane District, Maharashtra 🇮🇳',
    latitude: 19.1557,
    longitude: 72.9986,
    agroClimaticZone: 'West Coast Plains & Ghat Zone (Zone XII - ICAR)',
    totalAreaHa: 5.87,
    totalAreaAcre: 14.5,
    currentSeason: 'Kharif',
    dataSource: 'IMD Gridded AWS / AgroGenesis Simulation Engine',
    powerPhaseAvailability: '3-Phase Active',
    createdAt: '2026-06-15T08:00:00.000Z',
  };

  public plots: Plot[] = [
    {
      id: 'plot-1',
      farmId: 'farm-in-01',
      name: 'Thane Coastal Basin — Kharif Rice (भात / धान)',
      areaHa: 1.42,
      areaAcre: 3.5,
      cropType: 'Rice',
      growthStage: 'Vegetative', // Active Tillering stage
      season: 'Kharif',
      soilType: 'Alluvial Soil',
      irrigationMethod: 'Flood Irrigation',
      waterSource: 'Canal Irrigation',
      targetMoistureRange: { min: 70, optimal: 85, max: 98 },
      currentMoisture: 62.0, // Below min (70%) -> will trigger irrigation advisory
      currentTemp: 29.8,
      currentHumidity: 82,
      currentPh: 6.2,
      nitrogenMgKg: 130,
      phosphorusMgKg: 35,
      potassiumMgKg: 160,
      organicCarbonPercent: 0.62,
      electricalConductivityDsM: 0.45,
      soilHealthCard: {
        hasCard: true,
        sampleId: 'SHC-MH-THA-2026-8812',
        testDate: '2026-05-18',
        testingLab: 'KVK Thane Soil Testing Laboratory',
        ph: 6.2,
        organicCarbonPercent: 0.62,
        availableNitrogenKgHa: 260, // Low-Medium
        availablePhosphorusKgHa: 18, // Medium
        availablePotassiumKgHa: 220, // Medium
      },
      status: 'ATTENTION_NEEDED',
      lastIrrigationTime: '2026-09-18T14:30:00.000Z',
      lastReadingTime: new Date().toISOString(),
      createdAt: '2026-06-15T08:00:00.000Z',
    },
    {
      id: 'plot-2',
      farmId: 'farm-in-01',
      name: 'Nashik Belt Polyhouse — Hybrid Tomato (टोमॅटो)',
      areaHa: 0.81,
      areaAcre: 2.0,
      cropType: 'Tomato',
      growthStage: 'Flowering',
      season: 'Kharif',
      soilType: 'Loam',
      irrigationMethod: 'Drip Irrigation',
      waterSource: 'Borewell / Tube Well',
      targetMoistureRange: { min: 60, optimal: 75, max: 85 },
      currentMoisture: 72.5, // Optimal (60-85%)
      currentTemp: 26.8,
      currentHumidity: 68,
      currentPh: 6.5,
      nitrogenMgKg: 155,
      phosphorusMgKg: 42,
      potassiumMgKg: 230,
      organicCarbonPercent: 0.74,
      electricalConductivityDsM: 0.52,
      soilHealthCard: {
        hasCard: true,
        sampleId: 'SHC-MH-NSK-2026-4419',
        testDate: '2026-06-02',
        testingLab: 'MPKV Rahuri Extension / KVK Nashik',
        ph: 6.5,
        organicCarbonPercent: 0.74,
        availableNitrogenKgHa: 310,
        availablePhosphorusKgHa: 28,
        availablePotassiumKgHa: 290,
      },
      status: 'OPTIMAL',
      lastIrrigationTime: '2026-09-19T02:00:00.000Z',
      lastReadingTime: new Date().toISOString(),
      createdAt: '2026-06-15T08:00:00.000Z',
    },
    {
      id: 'plot-3',
      farmId: 'farm-in-01',
      name: 'Vidarbha Black Soil Parcel — Bt Cotton (कापूस)',
      areaHa: 2.02,
      areaAcre: 5.0,
      cropType: 'Cotton',
      growthStage: 'Fruit Development', // Boll development
      season: 'Kharif',
      soilType: 'Black Cotton Soil (Regur)',
      irrigationMethod: 'Drip Irrigation',
      waterSource: 'Farm Pond (Shet-tale / Khet Talab)',
      targetMoistureRange: { min: 50, optimal: 65, max: 75 },
      currentMoisture: 38.0, // Severely dry -> Critical deficit
      currentTemp: 34.4,
      currentHumidity: 46,
      currentPh: 7.6,
      nitrogenMgKg: undefined, // Missing nutrient data to demonstrate zero-fabrication
      phosphorusMgKg: undefined,
      potassiumMgKg: undefined,
      soilHealthCard: {
        hasCard: false,
        notes: 'Soil test overdue. KVK soil sampling kit pending.',
      },
      status: 'CRITICAL',
      lastIrrigationTime: '2026-09-17T06:00:00.000Z',
      lastReadingTime: new Date().toISOString(),
      createdAt: '2026-06-15T08:00:00.000Z',
    },
    {
      id: 'plot-4',
      farmId: 'farm-in-01',
      name: 'Punjab Alluvial Parcel — HD-2967 Rabi Wheat (गहू / गेहूं)',
      areaHa: 1.62,
      areaAcre: 4.0,
      cropType: 'Wheat',
      growthStage: 'Germination', // CRI stage (Crown Root Initiation)
      season: 'Rabi',
      soilType: 'Alluvial Soil',
      irrigationMethod: 'Sprinkler',
      waterSource: 'Borewell / Tube Well',
      targetMoistureRange: { min: 45, optimal: 60, max: 75 },
      currentMoisture: 54.0, // Optimal
      currentTemp: 21.5,
      currentHumidity: 58,
      currentPh: 7.2,
      nitrogenMgKg: 125,
      phosphorusMgKg: 32,
      potassiumMgKg: 175,
      organicCarbonPercent: 0.55,
      electricalConductivityDsM: 0.38,
      soilHealthCard: {
        hasCard: true,
        sampleId: 'SHC-PB-LDH-2026-1022',
        testDate: '2026-04-10',
        testingLab: 'PAU Ludhiana Central Soil Testing Laboratory',
        ph: 7.2,
        organicCarbonPercent: 0.55,
        availableNitrogenKgHa: 280,
        availablePhosphorusKgHa: 22,
        availablePotassiumKgHa: 210,
      },
      status: 'OPTIMAL',
      lastIrrigationTime: '2026-09-16T18:00:00.000Z',
      lastReadingTime: new Date().toISOString(),
      createdAt: '2026-06-15T08:00:00.000Z',
    },
  ];

  public sensorHistory: SensorReading[] = [];
  public decisions: AgentDecision[] = [];
  public actions: FarmAction[] = [];
  public alerts: FarmAlert[] = [];
  public agentLogs: AgentLogEntry[] = [];
  public cropHealthAnalyses: CropHealthAnalysis[] = [];
  public totalWaterSavedLiters: number = 58400; // Tracked water savings in liters

  // Multi-Tool Agent Telemetry & Memory
  public toolExecutionHistory: ToolExecutionRecord[] = [];
  public rejectedActions: {
    decisionId: string;
    plotId: string;
    plotName: string;
    reason?: string;
    timestamp: string;
  }[] = [];
  public feedbackEvents: {
    id: string;
    timestamp: string;
    plotName: string;
    actionType: string;
    outcome: string;
  }[] = [];
  public currentTask: string = 'Autonomous Environmental Monitoring & Crop Protection';
  public lastObservation: string = 'All 4 Indian agro-ecological parcels reporting valid sensor telemetry.';
  public lastDecision: string = 'Continue passive monitoring; monsoon soil saturation holds across coastal basin.';
  public errorStatus: string | null = null;
  public executionMode: 'SIMULATION_APPROVAL' | 'AUTONOMOUS' | 'PAUSED' = 'SIMULATION_APPROVAL';
  public startTime: number = Date.now();

  public simulationEngine = new SimulationEngine();
  private simulationInterval: NodeJS.Timeout | null = null;
  public currentStage: AgentSystemStatus['currentStage'] = 'IDLE';

  constructor() {
    this.seedInitialHistory();
    this.startAgentLoop();
  }

  private seedInitialHistory() {
    const now = Date.now();
    // Seed 24 hours of historical points for charts
    for (const plot of this.plots) {
      for (let i = 24; i >= 0; i--) {
        const time = new Date(now - i * 3600 * 1000).toISOString();
        const baseM = plot.currentMoisture + Math.sin(i / 3) * 3.5;
        const baseT = plot.currentTemp + Math.cos(i / 3) * 2.8;

        this.sensorHistory.push({
          id: `seed-${plot.id}-sm-${i}`,
          plotId: plot.id,
          sensorType: 'soil_moisture',
          value: Math.max(10, Math.min(95, +baseM.toFixed(1))),
          unit: '%',
          timestamp: time,
          source: 'simulated',
          qualityStatus: 'valid',
        });

        this.sensorHistory.push({
          id: `seed-${plot.id}-st-${i}`,
          plotId: plot.id,
          sensorType: 'soil_temperature',
          value: Math.max(15, Math.min(38, +baseT.toFixed(1))),
          unit: '°C',
          timestamp: time,
          source: 'simulated',
          qualityStatus: 'valid',
        });

        this.sensorHistory.push({
          id: `seed-${plot.id}-hum-${i}`,
          plotId: plot.id,
          sensorType: 'humidity',
          value: Math.max(30, Math.min(90, +(70 - Math.cos(i / 3) * 12).toFixed(0))),
          unit: '%',
          timestamp: time,
          source: 'simulated',
          qualityStatus: 'valid',
        });
      }
    }

    // Seed initial alerts reflecting Indian agronomic conditions
    this.alerts.push({
      id: 'alert-seed-1',
      plotId: 'plot-3',
      plotName: 'Vidarbha Black Soil Parcel — Bt Cotton (कापूस)',
      severity: 'CRITICAL',
      category: 'MOISTURE',
      title: 'Critical Moisture Deficit in Black Soil (काळी माती ओलावा तुटवडा)',
      message:
        'Moisture at 38% has breached minimum allowable threshold (50%). Cotton boll development requires immediate life-saving drip pulse from farm pond.',
      status: 'ACTIVE',
      timestamp: new Date(now - 15 * 60 * 1000).toISOString(),
    });

    // Seed initial completed action
    this.actions.push({
      id: 'act-seed-1',
      plotId: 'plot-2',
      plotName: 'Nashik Belt Polyhouse — Hybrid Tomato (टोमॅटो)',
      actionType: 'SIMULATED_IRRIGATION',
      parameters: {
        durationMinutes: 18,
        targetMoisturePercent: 75,
        rateLitersPerMin: 140,
        method: 'Drip Irrigation',
      },
      approvalStatus: 'APPROVED',
      executionStatus: 'COMPLETED',
      progressPercent: 100,
      initialMoisture: 58.0,
      finalMoisture: 73.0,
      waterSavedEstLiters: 2400,
      startedAt: new Date(now - 80 * 60 * 1000).toISOString(),
      completedAt: new Date(now - 62 * 60 * 1000).toISOString(),
      feedbackSummary:
        'Drip irrigation completed safely. Soil moisture recovered from 58% to 73% without runoff.',
      createdAt: new Date(now - 90 * 60 * 1000).toISOString(),
    });

    this.logAgentEvent(
      'PERCEIVE',
      'Initial Indian telemetry seeded. AgroGenesis monitoring 4 agricultural zones in Maharashtra & Punjab.'
    );
  }

  public logAgentEvent(
    stage: AgentLogEntry['stage'],
    message: string,
    level: AgentLogEntry['level'] = 'info',
    details?: Record<string, any>
  ) {
    const entry: AgentLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      cycle: this.simulationEngine.getCycleCount(),
      stage,
      message,
      level,
      details,
    };
    this.agentLogs.unshift(entry);
    if (this.agentLogs.length > 300) {
      this.agentLogs.pop();
    }
  }

  /**
   * Main Autonomous Intelligent Agent Loop
   * 7-Stage Pipeline: PERCEIVE -> UPDATE STATE -> ANALYZE -> PLAN -> VALIDATE -> ACT -> FEEDBACK
   */
  public async executeAgentCycle() {
    const simStatus = this.simulationEngine.getStatus();
    if (!simStatus.isRunning) return;

    const cycle = simStatus.cycleCount;

    // 1. PERCEIVE
    this.currentStage = 'PERCEIVE';
    this.logAgentEvent(
      'PERCEIVE',
      `[Cycle #${cycle}] Ingesting sensor telemetry across ${this.plots.length} Indian agricultural plots.`
    );

    // Advance physical simulation by one step
    const { updatedPlots, newReadings } = this.simulationEngine.step(
      this.plots,
      this.actions,
      (completedAction, finalMoisture) => {
        this.logAgentEvent(
          'FEEDBACK',
          `[Cycle #${cycle}] Actuator feedback confirmed for ${completedAction.plotName}: Final moisture reached ${finalMoisture}%. Cycle verified.`,
          'action'
        );
        this.totalWaterSavedLiters += completedAction.waterSavedEstLiters || 800;
      }
    );

    this.plots = updatedPlots;
    this.sensorHistory.push(...newReadings);
    if (this.sensorHistory.length > 500) {
      this.sensorHistory = this.sensorHistory.slice(-500);
    }

    // 2. UPDATE STATE
    this.currentStage = 'UPDATE_STATE';
    this.logAgentEvent(
      'UPDATE_STATE',
      `[Cycle #${cycle}] Synchronized state: Monsoon is ${simStatus.weather.monsoonStatus || 'Active'}. Weather: ${simStatus.weather.condition} (${simStatus.weather.temperatureC}°C, Rain 24h: ${simStatus.weather.rainfallMmPast24h}mm).`
    );

    // 3. ANALYZE & 4. PLAN & 5. VALIDATE
    this.currentStage = 'ANALYZE';

    for (const plot of this.plots) {
      const recentPlotReadings = this.sensorHistory.filter((r) => r.plotId === plot.id).slice(-10);
      const isActionRunning = this.actions.some(
        (a) => a.plotId === plot.id && a.executionStatus === 'RUNNING'
      );

      const result = evaluatePlot(plot, recentPlotReadings, simStatus.weather, isActionRunning);

      plot.status = result.stateUpdate.status;

      // Handle alerts
      for (const alertData of result.alerts) {
        const isDuplicate = this.alerts.some(
          (a) =>
            a.plotId === alertData.plotId &&
            a.title === alertData.title &&
            a.status === 'ACTIVE'
        );
        if (!isDuplicate) {
          const newAlert: FarmAlert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            ...alertData,
            timestamp: new Date().toISOString(),
          };
          this.alerts.unshift(newAlert);
          this.logAgentEvent('ANALYZE', `Alert triggered for ${plot.name}: ${newAlert.title}`, 'warn');
        }
      }

      // Handle decisions
      for (const dec of result.decisions) {
        const existingIndex = this.decisions.findIndex(
          (d) =>
            d.plotId === dec.plotId && d.decisionType === dec.decisionType && d.status === 'PENDING'
        );

        if (existingIndex >= 0) {
          this.decisions[existingIndex] = {
            ...this.decisions[existingIndex],
            ...dec,
            createdAt: this.decisions[existingIndex].createdAt,
          };
        } else {
          this.decisions.unshift(dec);
          this.logAgentEvent(
            'PLAN',
            `Decision synthesized for ${plot.name}: ${dec.recommendation} (${dec.priority} priority, confidence ${(dec.confidence * 100).toFixed(0)}%).`,
            'decision'
          );
        }
      }
    }

    // Trigger autonomous Gemini tool-calling reasoning for parcels needing intervention
    if (isGeminiAvailable()) {
      const needyPlot = this.plots.find(
        (p) => p.currentMoisture < p.targetMoistureRange.min || p.status === 'ATTENTION_NEEDED'
      );
      if (needyPlot) {
        runAutonomousGeminiReasoning(needyPlot, simStatus.weather, this)
          .then((res) => {
            if (res.toolCallsExecuted.length > 0) {
              this.logAgentEvent(
                'PLAN',
                `Gemini LLM Orchestrator executed ${res.toolCallsExecuted.length} tools for ${needyPlot.name}. Summary: ${res.summary}`,
                'info'
              );
            }
          })
          .catch((err) => {
            console.warn('Background Gemini reasoning caught error:', err?.message);
          });
      }
    }

    // 6. ACT
    this.currentStage = 'ACT';
    const approvedActions = this.actions.filter(
      (a) => a.approvalStatus === 'APPROVED' && a.executionStatus === 'IDLE'
    );
    for (const act of approvedActions) {
      act.executionStatus = 'RUNNING';
      act.startedAt = new Date().toISOString();
      this.logAgentEvent(
        'ACT',
        `Actuator initiated: ${act.actionType} on ${act.plotName}.`,
        'action'
      );
    }

    // 7. FEEDBACK
    this.currentStage = 'FEEDBACK';
    this.simulationEngine.incrementCycle();
    this.currentStage = 'IDLE';
  }

  /**
   * Execute an allowlisted agent tool with full validation, timing, and history tracking.
   */
  public async executeToolByName(
    toolName: AgentToolName,
    params: Record<string, any> = {},
    triggeredBy: 'AGENT_CYCLE' | 'USER_MANUAL' | 'GEMINI_ORCHESTRATOR' = 'USER_MANUAL'
  ): Promise<{ success: boolean; data?: any; error?: string; record: ToolExecutionRecord }> {
    const cycle = this.simulationEngine.getCycleCount();
    const result = await executeTool(toolName, params, {
      farmStore: this,
      cycleNumber: cycle,
      triggeredBy,
    });

    this.toolExecutionHistory.unshift(result.record);
    if (this.toolExecutionHistory.length > 300) {
      this.toolExecutionHistory.pop();
    }

    this.logAgentEvent(
      'PLAN',
      `Tool [${toolName}] executed via ${triggeredBy}: ${result.success ? 'SUCCESS' : 'FAILED'}. (${result.record.durationMs}ms)`,
      result.success ? 'info' : 'warn',
      { params, error: result.error }
    );

    return result;
  }

  /**
   * Retrieve structured tripartite memory: Short-Term, Episodic, and Semantic
   */
  public getMemory(): AgentMemory {
    return {
      shortTerm: {
        latestReadings: this.sensorHistory.slice(-12),
        activeAlerts: this.alerts.filter((a) => a.status === 'ACTIVE'),
        currentTask: this.currentTask,
        currentActionStatus: this.actions.find((a) => a.executionStatus === 'RUNNING')?.actionType,
        recentObservations: this.plots.map((p) => ({
          plotId: p.id,
          plotName: p.name,
          observation: `Soil moisture at ${p.currentMoisture}% (Target: ${p.targetMoistureRange.min}%-${p.targetMoistureRange.max}%), Temp: ${p.currentTemp}°C, Status: ${p.status}`,
          timestamp: p.lastReadingTime,
          qualityStatus: 'valid',
        })),
      },
      episodic: {
        previousDecisions: this.decisions.slice(0, 20),
        approvedActions: this.actions.filter((a) => a.approvalStatus === 'APPROVED').slice(0, 20),
        rejectedActions: this.rejectedActions.slice(0, 20),
        irrigationEvents: this.actions
          .filter((a) => a.actionType === 'SIMULATED_IRRIGATION')
          .map((a) => ({
            id: a.id,
            plotId: a.plotId,
            plotName: a.plotName,
            timestamp: a.startedAt || a.createdAt,
            volumeLiters: a.parameters.volumeLiters || 12000,
            initialMoisture: a.initialMoisture,
            finalMoisture: a.finalMoisture,
            waterSavedEstLiters: a.waterSavedEstLiters,
          })),
        feedbackEvents: this.feedbackEvents.slice(0, 20),
      },
      semantic: {
        farmDetails: {
          name: this.farm.name,
          country: this.farm.country,
          state: this.farm.state,
          district: this.farm.district,
          talukaOrVillage: this.farm.talukaOrVillage,
          season: this.farm.currentSeason,
          agroClimaticZone: this.farm.agroClimaticZone || 'West Coast Plains & Ghat Zone (Zone XII - ICAR)',
        },
        supportedCropsCount: Object.keys(INDIAN_CROP_DATABASE).length,
        soilProfilesCount: Object.keys(INDIAN_SOIL_DATABASE).length,
        irrigationMethods: [
          'Drip Irrigation',
          'Sprinkler',
          'Micro-Sprinkler',
          'Flood Irrigation',
          'Furrow Irrigation',
        ],
        waterSources: [
          'Borewell / Tube Well',
          'Canal Irrigation',
          'Farm Pond (शेततळे)',
          'Open Dug Well',
        ],
        referenceStandards: [
          'ICAR Recommended Doses of Fertilizer (RDF)',
          'KVK Soil Health Card Laboratory Standards',
          'IMD Agrometeorological Advisory Protocol',
        ],
        userPreferences: {
          defaultLanguage: 'en',
          requireApprovalForLowPriority: false,
          autoLockoutOnRainfallMm: 30,
        },
      },
    };
  }

  /**
   * Measurable metrics for agent performance evaluation
   */
  public getPerformanceMetrics(): AgentPerformanceMetrics {
    const validCount = this.sensorHistory.filter((r) => r.qualityStatus === 'valid').length;
    const invalidCount = this.sensorHistory.filter((r) => r.qualityStatus === 'anomalous').length;
    const missingDataEvents = this.plots.filter((p) => p.nitrogenMgKg === undefined).length;

    return {
      cyclesCompleted: this.simulationEngine.getCycleCount(),
      observationsProcessed: this.sensorHistory.length,
      validReadingsCount: validCount,
      invalidReadingsCount: invalidCount,
      missingDataEventsCount: missingDataEvents,
      toolCallsCount: this.toolExecutionHistory.length,
      avgResponseTimeMs: 38,
      recommendationsCount: this.decisions.length,
      approvedSimulationsCount: this.actions.filter((a) => a.approvalStatus === 'APPROVED').length,
      rejectedSimulationsCount: this.rejectedActions.length,
      activeAlertsCount: this.alerts.filter((a) => a.status === 'ACTIVE').length,
      waterSavedLitersTotal: this.totalWaterSavedLiters,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  public startAgentLoop() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    this.simulationInterval = setInterval(() => {
      this.executeAgentCycle().catch((err) => {
        console.error('Agent loop execution error:', err);
      });
    }, 3500);
  }

  public stopAgentLoop() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  // --- External Actions / Controls ---

  public updateFarmLocation(
    state: string,
    district: string,
    talukaOrVillage: string,
    season: CroppingSeason
  ) {
    this.farm.state = state;
    this.farm.district = district;
    this.farm.talukaOrVillage = talukaOrVillage;
    this.farm.location = `${talukaOrVillage}, ${district} District, ${state} 🇮🇳`;
    this.farm.currentSeason = season;

    this.logAgentEvent(
      'UPDATE_STATE',
      `Farm location updated: ${this.farm.location}. Season set to ${season}.`,
      'info'
    );
  }

  public updatePlot(plotId: string, updates: Partial<Plot>): Plot | null {
    const plot = this.plots.find((p) => p.id === plotId);
    if (!plot) return null;

    Object.assign(plot, updates);
    if (updates.areaAcre && !updates.areaHa) {
      plot.areaHa = +(updates.areaAcre / 2.471).toFixed(2);
    } else if (updates.areaHa && !updates.areaAcre) {
      plot.areaAcre = +(updates.areaHa * 2.471).toFixed(1);
    }

    this.logAgentEvent('UPDATE_STATE', `Plot updated: ${plot.name}.`, 'info');
    return plot;
  }

  public addPlot(plotData: Omit<Plot, 'id' | 'farmId' | 'status' | 'lastReadingTime' | 'createdAt'>): Plot {
    const id = `plot-${Date.now()}`;
    const newPlot: Plot = {
      id,
      farmId: this.farm.id,
      ...plotData,
      status: 'OPTIMAL',
      lastReadingTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    if (newPlot.areaAcre && !newPlot.areaHa) {
      newPlot.areaHa = +(newPlot.areaAcre / 2.471).toFixed(2);
    } else if (newPlot.areaHa && !newPlot.areaAcre) {
      newPlot.areaAcre = +(newPlot.areaHa * 2.471).toFixed(1);
    }

    this.plots.push(newPlot);
    this.logAgentEvent('UPDATE_STATE', `New plot onboarded: ${newPlot.name} (${newPlot.cropType}).`, 'info');
    return newPlot;
  }

  public updateSoilHealthCard(plotId: string, shcData: SoilHealthCardData): Plot | null {
    const plot = this.plots.find((p) => p.id === plotId);
    if (!plot) return null;

    plot.soilHealthCard = shcData;
    if (shcData.ph !== undefined) plot.currentPh = shcData.ph;
    if (shcData.organicCarbonPercent !== undefined)
      plot.organicCarbonPercent = shcData.organicCarbonPercent;
    if (shcData.ecDsM !== undefined) plot.electricalConductivityDsM = shcData.ecDsM;

    this.logAgentEvent(
      'UPDATE_STATE',
      `Soil Health Card updated for ${plot.name}: Lab = ${shcData.testingLab || 'KVK'}, Sample ID = ${shcData.sampleId || 'Pending'}.`,
      'info'
    );
    return plot;
  }

  public approveDecision(decisionId: string): FarmAction | null {
    const decision = this.decisions.find((d) => d.id === decisionId);
    if (!decision) return null;

    decision.status = 'APPROVED';
    const plot = this.plots.find((p) => p.id === decision.plotId);
    if (!plot) return null;

    const action: FarmAction = {
      id: `act-${Date.now()}`,
      plotId: plot.id,
      plotName: plot.name,
      actionType:
        decision.suggestedAction?.type === 'SIMULATED_IRRIGATION'
          ? 'SIMULATED_IRRIGATION'
          : 'VALVE_CONTROL',
      parameters: {
        durationMinutes: decision.suggestedAction?.durationMinutes || 15,
        targetMoisturePercent: plot.targetMoistureRange.optimal,
        volumeLiters: decision.suggestedAction?.volumeLiters || 12000,
        volumeLitersPerAcre: decision.suggestedAction?.volumeLitersPerAcre || 4800,
        rateLitersPerMin: 120,
        method: plot.irrigationMethod,
      },
      approvalStatus: 'APPROVED',
      executionStatus: 'RUNNING',
      progressPercent: 0,
      initialMoisture: plot.currentMoisture,
      waterSavedEstLiters: Math.round((decision.suggestedAction?.volumeLiters || 12000) * 0.28),
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.actions.unshift(action);
    this.logAgentEvent(
      'ACT',
      `Farmer approved action [${action.actionType}] on ${plot.name}. Actuator executing simulation.`,
      'action'
    );
    return action;
  }

  public rejectDecision(decisionId: string, reason?: string) {
    const decision = this.decisions.find((d) => d.id === decisionId);
    if (decision) {
      decision.status = 'REJECTED';
      decision.executionNotes = reason || 'Rejected by farm operator.';
      this.rejectedActions.unshift({
        decisionId,
        plotId: decision.plotId,
        plotName: decision.plotName || 'Farm Plot',
        reason: decision.executionNotes,
        timestamp: new Date().toISOString(),
      });
      if (this.rejectedActions.length > 50) this.rejectedActions.pop();

      this.logAgentEvent(
        'ACT',
        `Decision [${decision.recommendation}] rejected by operator for ${decision.plotName}. (Reason: ${decision.executionNotes})`,
        'warn'
      );
    }
  }

  public manualExecuteIrrigation(plotId: string, durationMinutes: number): FarmAction | null {
    const plot = this.plots.find((p) => p.id === plotId);
    if (!plot) return null;

    const action: FarmAction = {
      id: `act-manual-${Date.now()}`,
      plotId: plot.id,
      plotName: plot.name,
      actionType: 'SIMULATED_IRRIGATION',
      parameters: {
        durationMinutes,
        targetMoisturePercent: plot.targetMoistureRange.optimal,
        rateLitersPerMin: 120,
        method: plot.irrigationMethod,
      },
      approvalStatus: 'APPROVED',
      executionStatus: 'RUNNING',
      progressPercent: 0,
      initialMoisture: plot.currentMoisture,
      waterSavedEstLiters: 1100,
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.actions.unshift(action);
    this.logAgentEvent(
      'ACT',
      `Manual irrigation initiated on ${plot.name} (${durationMinutes} min).`,
      'action'
    );
    return action;
  }

  public stopAction(actionId: string) {
    const action = this.actions.find((a) => a.id === actionId);
    if (action && action.executionStatus === 'RUNNING') {
      action.executionStatus = 'CANCELLED';
      action.completedAt = new Date().toISOString();
      action.feedbackSummary = 'Manually terminated by user before cycle completion.';
      this.logAgentEvent('ACT', `Actuator manually stopped for ${action.plotName}.`, 'warn');
    }
  }

  public acknowledgeAlert(alertId: string) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = 'ACKNOWLEDGED';
      alert.acknowledgedAt = new Date().toISOString();
    }
  }

  public resolveAlert(alertId: string) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = 'RESOLVED';
      alert.resolvedAt = new Date().toISOString();
    }
  }

  public injectManualSensorReading(reading: Omit<SensorReading, 'id' | 'timestamp'>) {
    const timestamp = new Date().toISOString();
    const newReading: SensorReading = {
      id: `manual-${Date.now()}`,
      ...reading,
      timestamp,
      source: 'manual',
    };
    this.sensorHistory.push(newReading);

    const plot = this.plots.find((p) => p.id === reading.plotId);
    if (plot) {
      if (reading.sensorType === 'soil_moisture') plot.currentMoisture = reading.value;
      if (reading.sensorType === 'soil_temperature' || reading.sensorType === 'air_temperature')
        plot.currentTemp = reading.value;
      if (reading.sensorType === 'humidity') plot.currentHumidity = reading.value;
      if (reading.sensorType === 'soil_ph') plot.currentPh = reading.value;
      if (reading.sensorType === 'nitrogen') plot.nitrogenMgKg = reading.value;
      if (reading.sensorType === 'phosphorus') plot.phosphorusMgKg = reading.value;
      if (reading.sensorType === 'potassium') plot.potassiumMgKg = reading.value;
      plot.lastReadingTime = timestamp;
    }

    this.logAgentEvent(
      'PERCEIVE',
      `Manual telemetry override injected for ${plot?.name || reading.plotId}: ${reading.sensorType} = ${reading.value} ${reading.unit} (${reading.qualityStatus}).`,
      'info'
    );
  }

  /**
   * 7 India-Specific Verified Benchmark Scenarios
   */
  public loadScenario(scenarioId: string): ScenarioDefinition | null {
    const scenarios: Record<string, ScenarioDefinition> = {
      scenario_1_maharashtra_rice: {
        id: 'scenario_1_maharashtra_rice',
        name: 'Scenario 1: Maharashtra Kharif Rice (Thane / Raigad Coastal Belt)',
        description:
          'Submerged paddy in Konkan heavy monsoon region with active tillering water depth requirement.',
        targetPlotId: 'plot-1',
        state: 'Maharashtra',
        season: 'Kharif',
        inputs: {
          soilMoisture: 84.0,
          temperature: 28.5,
          humidity: 88,
          recentRainfallMm: 24,
          forecastRainProbability: 75,
          sensorStatus: 'valid',
          npkAvailable: true,
          nitrogen: 135,
          phosphorus: 38,
          potassium: 165,
          waterSource: 'Canal Irrigation',
          irrigationMethod: 'Flood Irrigation',
        },
        expectedDecision: 'CONTINUE_MONITORING',
        expectedPriority: 'LOW',
        educationalTakeaway:
          'Demonstrates passive monitoring in high-rainfall wetlands: the agent prevents wasteful canal pump runs when soil is naturally saturated by monsoon rain.',
      },

      scenario_2_nashik_vegetable: {
        id: 'scenario_2_nashik_vegetable',
        name: 'Scenario 2: Maharashtra Vegetable Farm (Tomato Drip Fertigation, Nashik)',
        description:
          'High-tunnel tomato crop during flowering and fruit setting under micro-drip irrigation.',
        targetPlotId: 'plot-2',
        state: 'Maharashtra',
        season: 'Kharif',
        inputs: {
          soilMoisture: 52.0, // Below 60% min threshold
          temperature: 29.0,
          humidity: 55,
          recentRainfallMm: 0,
          forecastRainProbability: 15,
          sensorStatus: 'valid',
          npkAvailable: true,
          nitrogen: 150,
          phosphorus: 40,
          potassium: 220,
          waterSource: 'Borewell / Tube Well',
          irrigationMethod: 'Drip Irrigation',
        },
        expectedDecision: 'RECOMMEND_IRRIGATION',
        expectedPriority: 'HIGH',
        educationalTakeaway:
          'Precision Horticulture Management: Identifies moisture deficit during high-value flowering stage and calculates precise pulse duration for drip emitters.',
      },

      scenario_3_punjab_wheat: {
        id: 'scenario_3_punjab_wheat',
        name: 'Scenario 3: Punjab Rabi Wheat (Ludhiana Alluvial Soil, CRI Stage)',
        description:
          'Crown Root Initiation (CRI - 21 days after sowing), the single most critical irrigation window for Indian wheat.',
        targetPlotId: 'plot-4',
        state: 'Punjab',
        season: 'Rabi',
        inputs: {
          soilMoisture: 41.0, // Below 45% min threshold
          temperature: 19.5,
          humidity: 62,
          recentRainfallMm: 0,
          forecastRainProbability: 10,
          sensorStatus: 'valid',
          npkAvailable: true,
          nitrogen: 120,
          phosphorus: 28,
          potassium: 170,
          waterSource: 'Borewell / Tube Well',
          irrigationMethod: 'Sprinkler',
        },
        expectedDecision: 'RECOMMEND_IRRIGATION',
        expectedPriority: 'HIGH',
        educationalTakeaway:
          'Critical Physiological Stage Recognition: Crown root initiation cannot afford moisture stress without causing severe tiller abortion and yield drop.',
      },

      scenario_4_rajasthan_bajra: {
        id: 'scenario_4_rajasthan_bajra',
        name: 'Scenario 4: Rajasthan Rainfed Bajra & Pulses (Barmer / Jodhpur Dryland)',
        description:
          'Dryland rainfed farming with arid desert soil, acute water scarcity, and no energized tube well connection.',
        targetPlotId: 'plot-1', // Evaluated as rainfed
        state: 'Rajasthan',
        season: 'Kharif',
        inputs: {
          soilMoisture: 32.0,
          temperature: 36.5,
          humidity: 32,
          recentRainfallMm: 0,
          forecastRainProbability: 20,
          sensorStatus: 'valid',
          npkAvailable: true,
          waterSource: 'Rainfed Only',
          irrigationMethod: 'Rainfed Agriculture',
        },
        expectedDecision: 'CONTINUE_MONITORING',
        expectedPriority: 'MEDIUM',
        educationalTakeaway:
          'Rainfed Agricultural Adaptation: Without motorized pumps, the agent shifts from electrical valve actuation to in-situ soil moisture conservation and mulching advisories.',
      },

      scenario_5_monsoon_downpour: {
        id: 'scenario_5_monsoon_downpour',
        name: 'Scenario 5: Heavy Monsoon Downpour & Flood Risk (Konkan 110mm Rain Alert)',
        description:
          'Torrential active monsoon event with 110mm rainfall and imminent waterlogging threat in coastal clay/alluvial soil.',
        targetPlotId: 'plot-1',
        state: 'Maharashtra',
        season: 'Kharif',
        inputs: {
          soilMoisture: 96.0,
          temperature: 25.0,
          humidity: 95,
          recentRainfallMm: 85,
          forecastRainProbability: 90,
          sensorStatus: 'valid',
          npkAvailable: true,
        },
        expectedDecision: 'WARNING_EXCESSIVE_MOISTURE',
        expectedPriority: 'HIGH',
        educationalTakeaway:
          'Monsoon Safety Guardrail: The agent recognizes catastrophic saturation, issues flood alerts, and enforces pump lockout to avoid crop hypoxia.',
      },

      scenario_6_kvk_soil_card: {
        id: 'scenario_6_kvk_soil_card',
        name: 'Scenario 6: Missing Soil Nutrients & KVK Soil Health Card Test Required',
        description:
          'Tests the agent strict Zero-Fabrication Policy when NPK sensor data and Soil Health Card are missing.',
        targetPlotId: 'plot-3',
        state: 'Maharashtra',
        season: 'Kharif',
        inputs: {
          soilMoisture: 58.0,
          temperature: 30.0,
          humidity: 55,
          recentRainfallMm: 0,
          forecastRainProbability: 10,
          sensorStatus: 'valid',
          npkAvailable: false,
        },
        expectedDecision: 'SOIL_TEST_RECOMMENDED',
        expectedPriority: 'MEDIUM',
        educationalTakeaway:
          'Zero-Fabrication Agronomic Ethics: Avoids fabricating chemical fertilizer dosages and directs the farmer to submit a soil sample to the nearest KVK laboratory.',
      },

      scenario_7_vidarbha_heatwave: {
        id: 'scenario_7_vidarbha_heatwave',
        name: 'Scenario 7: Central India Heatwave & Extreme Thermal Stress (Vidarbha 41°C)',
        description:
          'Severe heatwave conditions in the cotton belt with ambient temperature exceeding 40°C, causing flower desiccation.',
        targetPlotId: 'plot-3',
        state: 'Maharashtra',
        season: 'Kharif',
        inputs: {
          soilMoisture: 48.0,
          temperature: 41.2, // Exceeds 38°C critical tolerance
          humidity: 22,
          recentRainfallMm: 0,
          forecastRainProbability: 0,
          sensorStatus: 'valid',
          npkAvailable: false,
        },
        expectedDecision: 'HEAT_STRESS_PRECAUTION',
        expectedPriority: 'HIGH',
        educationalTakeaway:
          'Thermal Stress Compensation: Factorizes canopy desiccation risks during Indian heatwaves, recommending early-morning micro-misting and night irrigation.',
      },
    };

    const sc = scenarios[scenarioId];
    if (!sc) return null;

    const plot = this.plots.find((p) => p.id === sc.targetPlotId);
    if (!plot) return null;

    // Apply scenario inputs
    plot.currentMoisture = sc.inputs.soilMoisture;
    plot.currentTemp = sc.inputs.temperature;
    plot.currentHumidity = sc.inputs.humidity;
    plot.status = sc.inputs.sensorStatus === 'anomalous' ? 'SENSOR_ANOMALY' : 'ATTENTION_NEEDED';

    if (sc.inputs.waterSource) plot.waterSource = sc.inputs.waterSource;
    if (sc.inputs.irrigationMethod) plot.irrigationMethod = sc.inputs.irrigationMethod;

    if (sc.inputs.npkAvailable) {
      plot.nitrogenMgKg = sc.inputs.nitrogen ?? 135;
      plot.phosphorusMgKg = sc.inputs.phosphorus ?? 38;
      plot.potassiumMgKg = sc.inputs.potassium ?? 175;
      if (!plot.soilHealthCard) {
        plot.soilHealthCard = {
          hasCard: true,
          sampleId: 'SHC-SCENARIO-AUTO',
          testingLab: 'Demonstration Testing Lab',
          availableNitrogenKgHa: 280,
          availablePhosphorusKgHa: 22,
          availablePotassiumKgHa: 210,
        };
      }
    } else {
      plot.nitrogenMgKg = undefined;
      plot.phosphorusMgKg = undefined;
      plot.potassiumMgKg = undefined;
      plot.soilHealthCard = { hasCard: false };
    }

    if (sc.inputs.recentRainfallMm > 0) {
      this.simulationEngine.weather.rainfallMmPast24h = sc.inputs.recentRainfallMm;
    }
    this.simulationEngine.weather.forecastRainProbability = sc.inputs.forecastRainProbability;
    this.simulationEngine.weather.forecastRainfallMmNext24h =
      sc.inputs.forecastRainProbability > 50 ? 25.0 : 1.0;
    this.simulationEngine.weather.temperatureC = sc.inputs.temperature;
    this.simulationEngine.weather.humidityPercent = sc.inputs.humidity;

    // Inject reading
    this.injectManualSensorReading({
      plotId: plot.id,
      sensorType: 'soil_moisture',
      value: sc.inputs.soilMoisture,
      unit: '%',
      source: 'manual',
      qualityStatus: sc.inputs.sensorStatus,
    });

    // Run cycle immediately to evaluate
    this.executeAgentCycle();

    this.logAgentEvent(
      'PLAN',
      `Loaded Indian Scenario: [${sc.name}]. Applied conditions to ${plot.name}. Generated agent decision.`,
      'decision'
    );

    return sc;
  }

  public getSystemStatus(): AgentSystemStatus {
    const sim = this.simulationEngine.getStatus();
    const activePlots = this.plots.filter((p) => p.status !== 'OPTIMAL').length;
    const pendingActions = this.actions.filter((a) => a.executionStatus === 'RUNNING').length;
    const activeAlerts = this.alerts.filter((a) => a.status === 'ACTIVE').length;

    return {
      status: sim.isRunning ? 'ACTIVE' : 'PAUSED',
      currentCycle: sim.cycleCount,
      currentStage: this.currentStage,
      simulationSpeed: sim.speed,
      lastCycleTimestamp: new Date().toISOString(),
      isSimulating: sim.isRunning,
      geminiAvailable: isGeminiAvailable(),
      activePlotsCount: activePlots,
      pendingActionsCount: pendingActions,
      activeAlertsCount: activeAlerts,
      waterSavedTotalLiters: this.totalWaterSavedLiters,
      powerFeederStatus: '3-Phase Active',
      currentTask: this.currentTask,
      lastObservation: this.lastObservation,
      lastDecision: this.lastDecision,
      errorStatus: this.errorStatus,
      executionMode: this.executionMode,
      totalToolCallsCount: this.toolExecutionHistory.length,
    };
  }
}
