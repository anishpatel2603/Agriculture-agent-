import {
  Farm,
  Plot,
  SensorReading,
  AgentDecision,
  FarmAction,
  FarmAlert,
  AgentLogEntry,
  AgentSystemStatus,
  WeatherData,
  ScenarioDefinition,
  CropHealthAnalysis,
  SoilHealthCardData,
  CroppingSeason,
  SupportedLanguage,
  ConversationalChatResponse,
} from '../types';

export interface FarmStateResponse {
  farm: Farm;
  plots: Plot[];
  weather: WeatherData;
  systemStatus: AgentSystemStatus;
  decisions: AgentDecision[];
  actions: FarmAction[];
  alerts: FarmAlert[];
  logs: AgentLogEntry[];
}

export const api = {
  async getState(): Promise<FarmStateResponse> {
    const res = await fetch('/api/state');
    if (!res.ok) throw new Error('Failed to fetch farm state');
    return res.json();
  },

  async updateFarmLocation(data: {
    state: string;
    district: string;
    talukaOrVillage?: string;
    season?: CroppingSeason;
  }): Promise<{ success: boolean; farm: Farm }> {
    const res = await fetch('/api/farm/location', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update farm location');
    return res.json();
  },

  async getPlots(): Promise<Plot[]> {
    const res = await fetch('/api/plots');
    if (!res.ok) throw new Error('Failed to fetch plots');
    return res.json();
  },

  async savePlot(plot: Partial<Plot>): Promise<Plot> {
    const res = await fetch('/api/plots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plot),
    });
    if (!res.ok) throw new Error('Failed to save plot');
    return res.json();
  },

  async updatePlot(id: string, updates: Partial<Plot>): Promise<Plot> {
    const res = await fetch(`/api/plots/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update plot');
    return res.json();
  },

  async updateSoilHealthCard(
    plotId: string,
    shcData: SoilHealthCardData
  ): Promise<{ success: boolean; plot: Plot }> {
    const res = await fetch(`/api/plots/${plotId}/soil-health-card`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shcData),
    });
    if (!res.ok) throw new Error('Failed to update Soil Health Card');
    return res.json();
  },

  async getSensorHistory(plotId?: string, sensorType?: string): Promise<SensorReading[]> {
    const params = new URLSearchParams();
    if (plotId) params.append('plotId', plotId);
    if (sensorType) params.append('sensorType', sensorType);
    const res = await fetch(`/api/sensors/history?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch sensor history');
    return res.json();
  },

  async injectSensorReading(data: {
    plotId: string;
    sensorType: string;
    value: number;
    unit?: string;
    qualityStatus?: string;
  }) {
    const res = await fetch('/api/sensors/inject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateSimulationSettings(isRunning?: boolean, speed?: number) {
    const res = await fetch('/api/simulation/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRunning, speed }),
    });
    return res.json();
  },

  async triggerImmediateCycle() {
    const res = await fetch('/api/simulation/trigger-cycle', { method: 'POST' });
    return res.json();
  },

  async loadScenario(
    scenarioId: string
  ): Promise<{ success: boolean; scenario: ScenarioDefinition }> {
    const res = await fetch('/api/scenarios/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId }),
    });
    if (!res.ok) throw new Error('Failed to load scenario');
    return res.json();
  },

  async approveDecision(id: string): Promise<{ success: boolean; action: FarmAction }> {
    const res = await fetch(`/api/decisions/${id}/approve`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to approve decision');
    return res.json();
  },

  async rejectDecision(id: string, reason?: string) {
    const res = await fetch(`/api/decisions/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return res.json();
  },

  async explainDecisionWithAI(
    id: string,
    language: SupportedLanguage = 'en'
  ): Promise<{ explanation: string; geminiAvailable: boolean }> {
    const res = await fetch(`/api/decisions/${id}/explain-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language }),
    });
    if (!res.ok) throw new Error('Failed to get AI explanation');
    return res.json();
  },

  async manualExecuteIrrigation(plotId: string, durationMinutes: number) {
    const res = await fetch('/api/actions/manual-execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plotId, durationMinutes }),
    });
    return res.json();
  },

  async stopAction(actionId: string) {
    const res = await fetch(`/api/actions/${actionId}/stop`, { method: 'POST' });
    return res.json();
  },

  async acknowledgeAlert(id: string) {
    const res = await fetch(`/api/alerts/${id}/acknowledge`, { method: 'POST' });
    return res.json();
  },

  async resolveAlert(id: string) {
    const res = await fetch(`/api/alerts/${id}/resolve`, { method: 'POST' });
    return res.json();
  },

  async sendChat(
    message: string,
    plotId: string,
    language: SupportedLanguage = 'en',
    history?: { role: 'user' | 'assistant' | 'agent'; content: string }[],
    sessionContext?: { plotId?: string; crop?: string; growthStage?: string; location?: string }
  ): Promise<ConversationalChatResponse> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, plotId, language, history, sessionContext }),
    });
    if (!res.ok) throw new Error('Chat failed');
    return res.json();
  },

  async analyzeCropHealth(payload: {
    plotId: string;
    imageBase64?: string;
    mimeType?: string;
    notes?: string;
    language?: SupportedLanguage;
  }): Promise<CropHealthAnalysis> {
    const res = await fetch('/api/crop-health/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Crop health analysis failed');
    return res.json();
  },

  // -------------------------------------------------------------
  // AUTONOMOUS AGENT API METHODS (Section 18)
  // -------------------------------------------------------------

  async startAgent() {
    const res = await fetch('/api/agent/start', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start agent');
    return res.json();
  },

  async pauseAgent() {
    const res = await fetch('/api/agent/pause', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to pause agent');
    return res.json();
  },

  async stopAgent() {
    const res = await fetch('/api/agent/stop', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to stop agent');
    return res.json();
  },

  async runAgentCycle() {
    const res = await fetch('/api/agent/run-cycle', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to execute agent cycle');
    return res.json();
  },

  async getAgentStatus(): Promise<AgentSystemStatus> {
    const res = await fetch('/api/agent/status');
    if (!res.ok) throw new Error('Failed to fetch agent status');
    return res.json();
  },

  async getAgentEvents(limit = 50): Promise<{ events: AgentLogEntry[]; totalCount: number }> {
    const res = await fetch(`/api/agent/events?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch agent events');
    return res.json();
  },

  async getAgentMemory() {
    const res = await fetch('/api/agent/memory');
    if (!res.ok) throw new Error('Failed to fetch agent memory');
    return res.json();
  },

  async getAgentTools() {
    const res = await fetch('/api/agent/tools');
    if (!res.ok) throw new Error('Failed to fetch agent tools');
    return res.json();
  },

  async executeAgentTool(toolName: string, params: Record<string, any> = {}) {
    const res = await fetch('/api/agent/execute-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolName, params }),
    });
    if (!res.ok) throw new Error(`Tool execution failed for ${toolName}`);
    return res.json();
  },

  async getAgentMetrics() {
    const res = await fetch('/api/agent/metrics');
    if (!res.ok) throw new Error('Failed to fetch agent metrics');
    return res.json();
  },

  async approveAction(actionId: string) {
    const res = await fetch(`/api/actions/${actionId}/approve`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to approve action');
    return res.json();
  },

  async rejectAction(actionId: string, reason?: string) {
    const res = await fetch(`/api/actions/${actionId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to reject action');
    return res.json();
  },
};
