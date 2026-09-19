import React, { useState } from 'react';
import {
  FlaskRound,
  Play,
  CheckCircle2,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ACADEMIC_SCENARIOS } from '../data/scenarios';
import { ScenarioDefinition } from '../types';
import { useTranslation } from '../locales/LanguageContext';

interface ScenarioTestingViewProps {
  onLoadScenario: (scenarioId: string) => Promise<void>;
  activeScenarioId?: string;
}

export const ScenarioTestingView: React.FC<ScenarioTestingViewProps> = ({
  onLoadScenario,
  activeScenarioId,
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleRun = async (scenario: ScenarioDefinition) => {
    setLoadingId(scenario.id);
    try {
      await onLoadScenario(scenario.id);
    } catch (e) {
      console.error('Failed to load scenario:', e);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div id="scenario-testing-view" className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-center space-x-2">
          <FlaskRound className="h-5 w-5 text-emerald-800" />
          <h2 className="text-lg font-bold text-stone-900">
            {t.scenariosTitle || 'Indian Agronomic Test Scenarios (7 Benchmark Cases)'}
          </h2>
        </div>
        <p className="mt-1 text-xs text-stone-500 leading-relaxed">
          Calibrated to Indian agro-climatic conditions (ICAR, KVK, IMD, State Agricultural Universities). Each scenario injects localized monsoon, heatwave, water-rationing, sensor drift, or soil test conditions into the perception layer and validates whether the intelligent agent executes the mathematically and agronomically expected response.
        </p>
      </div>

      {/* Grid of 7 Scenarios */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ACADEMIC_SCENARIOS.map((scen: ScenarioDefinition, idx: number) => {
          const isCurrent = activeScenarioId === scen.id;
          const isLoading = loadingId === scen.id;

          return (
            <div
              key={scen.id}
              className={`flex flex-col justify-between rounded-xl border p-5 shadow-xs transition-all ${
                isCurrent
                  ? 'border-emerald-700 bg-emerald-50/30 ring-1 ring-emerald-700'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-white text-xs font-bold font-mono">
                      {idx + 1}
                    </span>
                    <h3 className="font-bold text-stone-900 text-sm">{scen.name}</h3>
                  </div>

                  {isCurrent && (
                    <span className="shrink-0 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      ACTIVE STATE
                    </span>
                  )}
                </div>

                {/* State & Season Badges */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                  {scen.state && (
                    <span className="flex items-center space-x-1 rounded-md bg-stone-100 px-2 py-0.5 font-medium text-stone-700">
                      <MapPin className="h-3 w-3 text-emerald-700" />
                      <span>{scen.state}</span>
                    </span>
                  )}
                  {scen.season && (
                    <span className="flex items-center space-x-1 rounded-md bg-amber-50 px-2 py-0.5 font-medium text-amber-800 border border-amber-200">
                      <Calendar className="h-3 w-3 text-amber-700" />
                      <span>{scen.season} Season</span>
                    </span>
                  )}
                  {scen.inputs.waterSource && (
                    <span className="rounded-md bg-sky-50 px-2 py-0.5 text-sky-800 border border-sky-200">
                      {scen.inputs.waterSource}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-stone-600 leading-relaxed">{scen.description}</p>

                {/* Injected Parameters Summary */}
                <div className="mt-3 rounded-lg bg-stone-50 p-3 text-xs">
                  <div className="font-semibold text-stone-700 text-[11px]">
                    Injected Perception Vector:
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-stone-600 text-[11px]">
                    <div>
                      <span className="font-medium text-stone-800">Target Plot:</span> {scen.targetPlotId}
                    </div>
                    <div>
                      <span className="font-medium text-stone-800">Moisture:</span>{' '}
                      {scen.inputs.soilMoisture}%
                    </div>
                    <div>
                      <span className="font-medium text-stone-800">Rainfall:</span>{' '}
                      {scen.inputs.recentRainfallMm}mm (Past 24h)
                    </div>
                    <div>
                      <span className="font-medium text-stone-800">Rain Prob:</span>{' '}
                      {scen.inputs.forecastRainProbability}%
                    </div>
                    <div>
                      <span className="font-medium text-stone-800">Temp:</span> {scen.inputs.temperature}°C
                    </div>
                    <div>
                      <span className="font-medium text-stone-800">Method:</span>{' '}
                      {scen.inputs.irrigationMethod || 'Drip'}
                    </div>
                    {scen.inputs.sensorStatus !== 'valid' && (
                      <div className="col-span-2 text-rose-700 font-medium">
                        ⚠️ Sensor Health: {scen.inputs.sensorStatus.toUpperCase()}
                      </div>
                    )}
                    {!scen.inputs.npkAvailable && (
                      <div className="col-span-2 text-amber-700 font-medium">
                        🛡️ Zero-Fabrication Test: NPK Telemetry NULL
                      </div>
                    )}
                  </div>
                </div>

                {/* Expected Behavior */}
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs">
                  <div className="flex items-center space-x-1.5 font-bold text-emerald-900 text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Expected Agent Action:</span>
                  </div>
                  <div className="mt-1 font-semibold text-emerald-900 text-xs">
                    {scen.expectedDecision.replace(/_/g, ' ')} ({scen.expectedPriority} Priority)
                  </div>
                </div>

                {/* Educational Takeaway */}
                <div className="mt-2 text-[11px] text-stone-500 italic">
                  <strong>Agronomic Takeaway:</strong> {scen.educationalTakeaway}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 border-t border-stone-100 pt-3">
                <button
                  onClick={() => handleRun(scen)}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center space-x-2 rounded-lg bg-emerald-800 py-2 text-xs font-medium text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>{isLoading ? 'Injecting State & Running...' : 'Inject & Run Scenario'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
