import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { FarmStore } from './server/farmStore';
import { REGISTERED_TOOLS } from './server/toolRegistry';
import { AgentToolName } from './src/types';
import {
  explainDecisionWithAI,
  analyzeCropHealthImage,
  handleAssistantChat,
  isGeminiAvailable,
} from './server/geminiService';
import { orchestrateConversationalResponse } from './server/conversationalAgent';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '15mb' }));

  const farmStore = new FarmStore();

  // -------------------------------------------------------------
  // API ROUTES (Mounted before Vite middleware)
  // -------------------------------------------------------------

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      agent: 'AgroGenesis Autonomous Indian Agricultural Decision-Support Agent',
      version: '2.0.0',
      uptimeSeconds: process.uptime(),
      geminiAvailable: isGeminiAvailable(),
      timestamp: new Date().toISOString(),
    });
  });

  // -------------------------------------------------------------
  // AUTONOMOUS AGENT API ROUTES (Section 18)
  // -------------------------------------------------------------

  // POST /api/agent/start
  app.post('/api/agent/start', (req: Request, res: Response) => {
    farmStore.simulationEngine.setRunning(true);
    farmStore.executionMode = 'AUTONOMOUS';
    farmStore.logAgentEvent('PERCEIVE', 'Autonomous Agent monitoring cycle started.', 'info');
    res.json({ success: true, status: farmStore.getSystemStatus() });
  });

  // POST /api/agent/pause
  app.post('/api/agent/pause', (req: Request, res: Response) => {
    farmStore.simulationEngine.setRunning(false);
    farmStore.executionMode = 'PAUSED';
    farmStore.logAgentEvent('PERCEIVE', 'Autonomous Agent monitoring loop paused by operator.', 'warn');
    res.json({ success: true, status: farmStore.getSystemStatus() });
  });

  // POST /api/agent/stop
  app.post('/api/agent/stop', (req: Request, res: Response) => {
    farmStore.simulationEngine.setRunning(false);
    farmStore.executionMode = 'PAUSED';
    farmStore.logAgentEvent('PERCEIVE', 'Autonomous Agent cycle stopped.', 'warn');
    res.json({ success: true, status: farmStore.getSystemStatus() });
  });

  // POST /api/agent/run-cycle
  app.post('/api/agent/run-cycle', async (req: Request, res: Response) => {
    await farmStore.executeAgentCycle();
    res.json({ success: true, status: farmStore.getSystemStatus() });
  });

  // GET /api/agent/status
  app.get('/api/agent/status', (req: Request, res: Response) => {
    res.json(farmStore.getSystemStatus());
  });

  // GET /api/agent/events
  app.get('/api/agent/events', (req: Request, res: Response) => {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)));
    res.json({
      events: farmStore.agentLogs.slice(0, limit),
      totalCount: farmStore.agentLogs.length,
    });
  });

  // GET /api/agent/decisions
  app.get('/api/agent/decisions', (req: Request, res: Response) => {
    res.json({
      decisions: farmStore.decisions,
      pendingCount: farmStore.decisions.filter((d) => d.status === 'PENDING').length,
    });
  });

  // GET /api/agent/memory
  app.get('/api/agent/memory', (req: Request, res: Response) => {
    res.json(farmStore.getMemory());
  });

  // GET /api/agent/tools
  app.get('/api/agent/tools', (req: Request, res: Response) => {
    res.json({
      tools: Object.values(REGISTERED_TOOLS),
      history: farmStore.toolExecutionHistory.slice(0, 50),
      totalCallsCount: farmStore.toolExecutionHistory.length,
    });
  });

  // POST /api/agent/execute-tool
  app.post('/api/agent/execute-tool', async (req: Request, res: Response) => {
    const { toolName, params } = req.body;
    if (!toolName) {
      res.status(400).json({ error: 'toolName is required' });
      return;
    }
    const result = await farmStore.executeToolByName(
      toolName as AgentToolName,
      params || {},
      'USER_MANUAL'
    );
    res.json(result);
  });

  // GET /api/agent/metrics
  app.get('/api/agent/metrics', (req: Request, res: Response) => {
    res.json(farmStore.getPerformanceMetrics());
  });

  // POST /api/actions/:actionId/approve
  app.post('/api/actions/:actionId/approve', (req: Request, res: Response) => {
    const actionId = req.params.actionId;
    const action = farmStore.actions.find((a) => a.id === actionId);
    if (action) {
      action.approvalStatus = 'APPROVED';
      action.executionStatus = 'RUNNING';
      action.startedAt = new Date().toISOString();
      farmStore.logAgentEvent(
        'ACT',
        `Human approval verified for action: ${action.actionType} on ${action.plotName}`,
        'action'
      );
      res.json({ success: true, action });
      return;
    }

    // Check if actionId corresponds to a decision ID
    const approvedAction = farmStore.approveDecision(actionId);
    if (approvedAction) {
      res.json({ success: true, action: approvedAction });
      return;
    }

    res.status(404).json({ error: 'Action or decision not found' });
  });

  // POST /api/actions/:actionId/reject
  app.post('/api/actions/:actionId/reject', (req: Request, res: Response) => {
    const actionId = req.params.actionId;
    const { reason } = req.body;

    const action = farmStore.actions.find((a) => a.id === actionId);
    if (action) {
      action.approvalStatus = 'REJECTED';
      action.executionStatus = 'CANCELLED';
      farmStore.logAgentEvent(
        'ACT',
        `Action rejected by operator: ${action.actionType} on ${action.plotName}. (Reason: ${reason || 'Manual rejection'})`,
        'warn'
      );
      res.json({ success: true });
      return;
    }

    // Check if it's a decision
    farmStore.rejectDecision(actionId, reason);
    res.json({ success: true });
  });

  // POST /api/simulation/scenario
  app.post('/api/simulation/scenario', (req: Request, res: Response) => {
    const { scenarioId } = req.body;
    const scenario = farmStore.loadScenario(scenarioId);
    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }
    res.json({ success: true, scenario });
  });

  // Get full farm environment state
  app.get('/api/state', (req: Request, res: Response) => {
    const systemStatus = farmStore.getSystemStatus();
    res.json({
      farm: farmStore.farm,
      plots: farmStore.plots,
      weather: farmStore.simulationEngine.weather,
      systemStatus,
      decisions: farmStore.decisions.slice(0, 30),
      actions: farmStore.actions.slice(0, 30),
      alerts: farmStore.alerts.slice(0, 50),
      logs: farmStore.agentLogs.slice(0, 50),
    });
  });

  // Farm Location & Region Configuration
  app.put('/api/farm/location', (req: Request, res: Response) => {
    const { state, district, talukaOrVillage, season } = req.body;
    if (!state || !district) {
      res.status(400).json({ error: 'state and district are required' });
      return;
    }
    farmStore.updateFarmLocation(
      state,
      district,
      talukaOrVillage || district,
      season || 'Kharif'
    );
    res.json({ success: true, farm: farmStore.farm });
  });

  // Get all plots
  app.get('/api/plots', (req: Request, res: Response) => {
    res.json(farmStore.plots);
  });

  // Create or register a plot
  app.post('/api/plots', (req: Request, res: Response) => {
    const body = req.body;
    if (!body.name || !body.cropType) {
      res.status(400).json({ error: 'Name and cropType are required' });
      return;
    }

    const newPlot = farmStore.addPlot({
      name: body.name,
      areaHa: body.areaHa || 1.5,
      areaAcre: body.areaAcre || 3.7,
      cropType: body.cropType,
      growthStage: body.growthStage || 'Vegetative',
      season: body.season || 'Kharif',
      soilType: body.soilType || 'Loam',
      irrigationMethod: body.irrigationMethod || 'Drip Irrigation',
      waterSource: body.waterSource || 'Borewell / Tube Well',
      targetMoistureRange: body.targetMoistureRange || { min: 50, optimal: 65, max: 80 },
      currentMoisture: body.currentMoisture || 60,
      currentTemp: 28,
      currentHumidity: 65,
      currentPh: body.currentPh || 6.8,
      nitrogenMgKg: body.nitrogenMgKg,
      phosphorusMgKg: body.phosphorusMgKg,
      potassiumMgKg: body.potassiumMgKg,
      soilHealthCard: body.soilHealthCard,
    });

    res.status(201).json(newPlot);
  });

  // Update a plot
  app.put('/api/plots/:id', (req: Request, res: Response) => {
    const updated = farmStore.updatePlot(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Plot not found' });
      return;
    }
    res.json(updated);
  });

  // Update Soil Health Card
  app.put('/api/plots/:id/soil-health-card', (req: Request, res: Response) => {
    const updated = farmStore.updateSoilHealthCard(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Plot not found' });
      return;
    }
    res.json({ success: true, plot: updated });
  });

  // Sensor telemetry history for charts
  app.get('/api/sensors/history', (req: Request, res: Response) => {
    const plotId = req.query.plotId as string;
    const sensorType = req.query.sensorType as string;

    let readings = farmStore.sensorHistory;
    if (plotId) {
      readings = readings.filter((r) => r.plotId === plotId);
    }
    if (sensorType) {
      readings = readings.filter((r) => r.sensorType === sensorType);
    }

    res.json(readings.slice(-120));
  });

  // Manual or external sensor injection
  app.post('/api/sensors/inject', (req: Request, res: Response) => {
    const { plotId, sensorType, value, unit, qualityStatus } = req.body;
    if (!plotId || !sensorType || value === undefined) {
      res.status(400).json({ error: 'Missing plotId, sensorType, or value' });
      return;
    }

    farmStore.injectManualSensorReading({
      plotId,
      sensorType,
      value: Number(value),
      unit: unit || '%',
      source: 'manual',
      qualityStatus: qualityStatus || 'valid',
    });

    res.json({ success: true, message: 'Sensor reading ingested.' });
  });

  // Simulation controls
  app.post('/api/simulation/settings', (req: Request, res: Response) => {
    const { isRunning, speed } = req.body;
    if (typeof isRunning === 'boolean') {
      farmStore.simulationEngine.setRunning(isRunning);
    }
    if (typeof speed === 'number') {
      farmStore.simulationEngine.setSpeed(speed);
    }
    res.json(farmStore.simulationEngine.getStatus());
  });

  // Trigger manual immediate agent cycle
  app.post('/api/simulation/trigger-cycle', async (req: Request, res: Response) => {
    await farmStore.executeAgentCycle();
    res.json({ success: true, cycle: farmStore.simulationEngine.getCycleCount() });
  });

  // Load predefined scenario
  app.post('/api/scenarios/load', (req: Request, res: Response) => {
    const { scenarioId } = req.body;
    const scenario = farmStore.loadScenario(scenarioId);
    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }
    res.json({ success: true, scenario });
  });

  // Approve an agent decision
  app.post('/api/decisions/:id/approve', (req: Request, res: Response) => {
    const action = farmStore.approveDecision(req.params.id);
    if (!action) {
      res.status(404).json({ error: 'Decision not found or already processed' });
      return;
    }
    res.json({ success: true, action });
  });

  // Reject an agent decision
  app.post('/api/decisions/:id/reject', (req: Request, res: Response) => {
    farmStore.rejectDecision(req.params.id, req.body.reason);
    res.json({ success: true });
  });

  // AI-enhanced explanation of decision (supports 'en' | 'hi' | 'mr')
  app.post('/api/decisions/:id/explain-ai', async (req: Request, res: Response) => {
    const decision = farmStore.decisions.find((d) => d.id === req.params.id);
    if (!decision) {
      res.status(404).json({ error: 'Decision not found' });
      return;
    }
    const plot = farmStore.plots.find((p) => p.id === decision.plotId);
    if (!plot) {
      res.status(404).json({ error: 'Plot not found' });
      return;
    }

    const language = (req.body.language || 'en') as 'en' | 'hi' | 'mr';
    const explanation = await explainDecisionWithAI(
      plot,
      decision,
      farmStore.simulationEngine.weather,
      language
    );
    decision.aiEnhanced = true;
    decision.aiExplanation = explanation;

    res.json({ explanation, geminiAvailable: isGeminiAvailable() });
  });

  // Manual irrigation execution
  app.post('/api/actions/manual-execute', (req: Request, res: Response) => {
    const { plotId, durationMinutes } = req.body;
    if (!plotId) {
      res.status(400).json({ error: 'plotId required' });
      return;
    }
    const action = farmStore.manualExecuteIrrigation(plotId, durationMinutes || 15);
    res.json({ success: true, action });
  });

  // Stop running action
  app.post('/api/actions/:id/stop', (req: Request, res: Response) => {
    farmStore.stopAction(req.params.id);
    res.json({ success: true });
  });

  // Alerts acknowledgement & resolution
  app.post('/api/alerts/:id/acknowledge', (req: Request, res: Response) => {
    farmStore.acknowledgeAlert(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/alerts/:id/resolve', (req: Request, res: Response) => {
    farmStore.resolveAlert(req.params.id);
    res.json({ success: true });
  });

  // Conversational agricultural assistant chat (supports 'en' | 'hi' | 'mr')
  app.post('/api/chat', async (req: Request, res: Response) => {
    const { message, plotId, language, history, sessionContext } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Valid message string required' });
      return;
    }

    console.log('[API /api/chat] Message received from client:', {
      messagePreview: message.length > 80 ? message.slice(0, 80) + '...' : message,
      plotId,
      language: language || 'en',
    });

    try {
      const result = await orchestrateConversationalResponse(
        {
          message,
          plotId,
          language: (language || 'en') as 'en' | 'hi' | 'mr',
          history: Array.isArray(history) ? history : [],
          sessionContext,
        },
        farmStore
      );

      res.json(result);
    } catch (err: any) {
      console.error('Conversational agent error:', err);
      res.status(500).json({
        error: 'Conversational agent error',
        details: err?.message,
      });
    }
  });

  // Crop health image analysis (supports 'en' | 'hi' | 'mr')
  app.post('/api/crop-health/analyze', async (req: Request, res: Response) => {
    const { plotId, imageBase64, mimeType, notes, language } = req.body;
    const plot = farmStore.plots.find((p) => p.id === plotId) || farmStore.plots[0];

    const analysis = await analyzeCropHealthImage(plot, imageBase64, mimeType, notes, language || 'en');
    farmStore.cropHealthAnalyses.unshift(analysis);

    farmStore.logAgentEvent(
      'ANALYZE',
      `Crop health analysis logged for ${plot.name}: ${analysis.healthStatus} (${(analysis.confidence * 100).toFixed(0)}% confidence).`,
      analysis.healthStatus === 'HEALTHY' ? 'info' : 'warn'
    );

    res.json(analysis);
  });

  // Weather data
  app.get('/api/weather', (req: Request, res: Response) => {
    res.json(farmStore.simulationEngine.weather);
  });

  // -------------------------------------------------------------
  // Vite Integration (Dev vs Prod)
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AgroGenesis India] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[AgroGenesis India] Failed to start server:', err);
  process.exit(1);
});
