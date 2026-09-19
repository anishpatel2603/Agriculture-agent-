import React, { useState, useEffect, useCallback } from 'react';
import {
  Plot,
  AgentDecision,
  FarmAction,
  FarmAlert,
  AgentLogEntry,
  AgentSystemStatus,
  WeatherData,
  Farm,
} from './types';
import { api, FarmStateResponse } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PlotManagementView } from './components/PlotManagementView';
import { LiveSensorView } from './components/LiveSensorView';
import { AgentControlCenterView } from './components/AgentControlCenterView';
import { AgentToolWorkbenchView } from './components/AgentToolWorkbenchView';
import { AgentMemoryInspectorView } from './components/AgentMemoryInspectorView';
import { AgentMetricsView } from './components/AgentMetricsView';
import { IrrigationDecisionsView } from './components/IrrigationDecisionsView';
import { FertilizationView } from './components/FertilizationView';
import { CropHealthView } from './components/CropHealthView';
import { AlertsView } from './components/AlertsView';
import { ActionHistoryView } from './components/ActionHistoryView';
import { ScenarioTestingView } from './components/ScenarioTestingView';
import { ArchitectureView } from './components/ArchitectureView';
import { PeasModelView } from './components/PeasModelView';
import { SettingsView } from './components/SettingsView';
import { AssistantChatModal } from './components/AssistantChatModal';
import { Sparkles, Bot, AlertCircle } from 'lucide-react';
import { useTranslation } from './locales/LanguageContext';

export default function App() {
  const { language } = useTranslation();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedPlotId, setSelectedPlotId] = useState<string>('');
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string | undefined>(undefined);

  // Core State
  const [farm, setFarm] = useState<Farm | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [actions, setActions] = useState<FarmAction[]>([]);
  const [alerts, setAlerts] = useState<FarmAlert[]>([]);
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [weather, setWeather] = useState<WeatherData>({
    temperatureC: 27,
    humidityPercent: 55,
    rainfallMmPast24h: 0,
    forecastRainfallMmNext24h: 0,
    forecastRainProbability: 10,
    windSpeedKmh: 12,
    solarRadiationWm2: 650,
    condition: 'Sunny',
    lastUpdated: new Date().toISOString(),
    isSimulated: true,
  });
  const [systemStatus, setSystemStatus] = useState<AgentSystemStatus>({
    status: 'ACTIVE',
    currentCycle: 0,
    currentStage: 'PERCEIVE',
    isSimulating: true,
    simulationSpeed: 2,
    waterSavedTotalLiters: 14200,
    activePlotsCount: 4,
    activeAlertsCount: 0,
    pendingActionsCount: 0,
    lastCycleTimestamp: new Date().toISOString(),
    geminiAvailable: true,
  });

  // State synchronization with server
  const fetchState = useCallback(async () => {
    try {
      const state: FarmStateResponse = await api.getState();
      if (state.farm) {
        setFarm(state.farm);
      }
      setPlots(state.plots);
      setDecisions(state.decisions);
      setActions(state.actions);
      setAlerts(state.alerts);
      setLogs(state.logs);
      setWeather(state.weather);
      setSystemStatus(state.systemStatus);

      if (!selectedPlotId && state.plots.length > 0) {
        setSelectedPlotId(state.plots[0].id);
      }
    } catch (err) {
      console.error('State sync error:', err);
    }
  }, [selectedPlotId]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3500);
    return () => clearInterval(interval);
  }, [fetchState]);

  // Handlers
  const handleToggleSimulation = async () => {
    await api.updateSimulationSettings(!systemStatus.isSimulating);
    fetchState();
  };

  const handleChangeSpeed = async (speed: number) => {
    await api.updateSimulationSettings(undefined, speed);
    fetchState();
  };

  const handleTriggerCycle = async () => {
    await api.triggerImmediateCycle();
    fetchState();
  };

  const handleLoadScenario = async (scenarioId: string) => {
    setActiveScenarioId(scenarioId);
    await api.loadScenario(scenarioId);
    await api.triggerImmediateCycle();
    await fetchState();
  };

  const handleApproveDecision = async (id: string) => {
    await api.approveDecision(id);
    fetchState();
  };

  const handleRejectDecision = async (id: string) => {
    await api.rejectDecision(id);
    fetchState();
  };

  const handleExplainAI = async (id: string) => {
    await api.explainDecisionWithAI(id, language);
    fetchState();
  };

  const handleManualExecute = async (plotId: string, durationMinutes: number) => {
    await api.manualExecuteIrrigation(plotId, durationMinutes);
    fetchState();
  };

  const handleStopAction = async (actionId: string) => {
    await api.stopAction(actionId);
    fetchState();
  };

  const handleAcknowledgeAlert = async (id: string) => {
    await api.acknowledgeAlert(id);
    fetchState();
  };

  const handleResolveAlert = async (id: string) => {
    await api.resolveAlert(id);
    fetchState();
  };

  const handleSavePlot = async (plotData: Partial<Plot>) => {
    await api.savePlot(plotData);
    fetchState();
  };

  const handleResetDemo = async () => {
    await handleLoadScenario('scenario_1_konkan_rice_monsoon');
    fetchState();
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-100/70 font-sans text-stone-900 antialiased selection:bg-emerald-200">
      {/* Top Telemetry & Control Navigation */}
      <Navbar
        systemStatus={systemStatus}
        weather={weather}
        farm={farm || undefined}
        onToggleSimulation={handleToggleSimulation}
        onChangeSpeed={handleChangeSpeed}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onTriggerCycle={handleTriggerCycle}
        onSelectPage={setCurrentPage}
      />

      {/* Main Workspace: Sidebar + Dynamic View Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onSelectPage={setCurrentPage}
          activeAlertsCount={systemStatus.activeAlertsCount}
          pendingDecisionsCount={systemStatus.pendingActionsCount}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {currentPage === 'dashboard' && (
              <DashboardView
                plots={plots}
                decisions={decisions}
                alerts={alerts}
                weather={weather}
                systemStatus={systemStatus}
                onApproveDecision={handleApproveDecision}
                onRejectDecision={handleRejectDecision}
                onExplainAI={handleExplainAI}
                onSelectPlot={(pId) => {
                  setSelectedPlotId(pId);
                  setCurrentPage('sensors');
                }}
                onSelectPage={setCurrentPage}
                onLoadScenario={handleLoadScenario}
              />
            )}

            {currentPage === 'plots' && (
              <PlotManagementView plots={plots} onSavePlot={handleSavePlot} />
            )}

            {currentPage === 'sensors' && (
              <LiveSensorView
                plots={plots}
                selectedPlotId={selectedPlotId}
                onSelectPlot={setSelectedPlotId}
              />
            )}

            {currentPage === 'agent' && (
              <AgentControlCenterView
                systemStatus={systemStatus}
                logs={logs}
                decisions={decisions}
                actions={actions}
                plots={plots}
                onToggleSimulation={handleToggleSimulation}
                onChangeSpeed={handleChangeSpeed}
                onTriggerCycle={handleTriggerCycle}
                onApproveDecision={handleApproveDecision}
                onRejectDecision={handleRejectDecision}
                onNavigateToTools={() => setCurrentPage('tools')}
              />
            )}

            {currentPage === 'tools' && <AgentToolWorkbenchView />}

            {currentPage === 'memory' && <AgentMemoryInspectorView />}

            {currentPage === 'metrics' && <AgentMetricsView />}

            {currentPage === 'irrigation' && (
              <IrrigationDecisionsView
                decisions={decisions}
                plots={plots}
                weather={weather}
                onApprove={handleApproveDecision}
                onReject={handleRejectDecision}
                onExplainAI={handleExplainAI}
                onManualExecute={handleManualExecute}
              />
            )}

            {currentPage === 'fertilization' && <FertilizationView plots={plots} />}

            {(currentPage === 'cropHealth' || currentPage === 'crop-health') && <CropHealthView plots={plots} />}

            {currentPage === 'alerts' && (
              <AlertsView
                alerts={alerts}
                onAcknowledge={handleAcknowledgeAlert}
                onResolve={handleResolveAlert}
              />
            )}

            {currentPage === 'history' && (
              <ActionHistoryView actions={actions} onStopAction={handleStopAction} />
            )}

            {currentPage === 'scenarios' && (
              <ScenarioTestingView
                onLoadScenario={handleLoadScenario}
                activeScenarioId={activeScenarioId}
              />
            )}

            {currentPage === 'architecture' && <ArchitectureView />}

            {currentPage === 'peas' && <PeasModelView />}

            {currentPage === 'settings' && (
              <SettingsView
                systemStatus={systemStatus}
                farm={farm || undefined}
                onResetDemo={handleResetDemo}
                onFarmUpdated={(updatedFarm) => setFarm(updatedFarm)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Floating Grounded Copilot Launcher */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 rounded-full bg-emerald-800 px-4 py-3 text-xs font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-emerald-700"
      >
        <Bot className="h-4 w-4 text-emerald-200" />
        <span>Ask AgroGenesis Copilot</span>
      </button>

      {/* Grounded Conversational Assistant Modal */}
      <AssistantChatModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        plots={plots}
        selectedPlotId={selectedPlotId}
        onSelectPlot={setSelectedPlotId}
      />
    </div>
  );
}
