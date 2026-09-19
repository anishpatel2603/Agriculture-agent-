import React, { useState } from 'react';
import {
  Droplet,
  CheckCircle2,
  XCircle,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Play,
  Clock,
  ShieldCheck,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { AgentDecision, Plot, WeatherData } from '../types';

interface IrrigationDecisionsViewProps {
  decisions: AgentDecision[];
  plots: Plot[];
  weather: WeatherData;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onExplainAI: (id: string) => void;
  onManualExecute: (plotId: string, durationMinutes: number) => void;
}

export const IrrigationDecisionsView: React.FC<IrrigationDecisionsViewProps> = ({
  decisions,
  plots,
  weather,
  onApprove,
  onReject,
  onExplainAI,
  onManualExecute,
}) => {
  const [selectedDecision, setSelectedDecision] = useState<AgentDecision | null>(
    decisions[0] || null
  );
  const [manualPlotId, setManualPlotId] = useState<string>(plots[0]?.id || '');
  const [manualDuration, setManualDuration] = useState<number>(15);

  const activePlot = plots.find((p) => p.id === selectedDecision?.plotId) || plots[0];

  return (
    <div id="irrigation-decisions-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Irrigation Decision Engine</h2>
          <p className="text-xs text-stone-500">
            Transparent, multi-factor agronomic utility calculations, safety guardrails, and operator approval controls.
          </p>
        </div>

        {/* Manual Pulse Trigger */}
        <div className="flex items-center space-x-2 rounded-lg border border-stone-200 bg-white p-1.5 text-xs shadow-xs">
          <span className="font-semibold text-stone-700 px-1">Manual Pulse:</span>
          <select
            value={manualPlotId}
            onChange={(e) => setManualPlotId(e.target.value)}
            className="rounded border border-stone-300 p-1 text-stone-800"
          >
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={5}
            max={60}
            value={manualDuration}
            onChange={(e) => setManualDuration(Number(e.target.value))}
            className="w-14 rounded border border-stone-300 p-1 text-center font-mono"
            title="Duration (Minutes)"
          />
          <span className="text-stone-500">min</span>
          <button
            onClick={() => onManualExecute(manualPlotId, manualDuration)}
            className="flex items-center space-x-1 rounded bg-emerald-800 px-2.5 py-1 font-medium text-white hover:bg-emerald-700"
          >
            <Play className="h-3 w-3" />
            <span>Simulate</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Decision List on Left, Deep Evidence Matrix on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Decision Cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Synthesized Decisions ({decisions.length})
          </h3>

          <div className="space-y-2.5">
            {decisions.map((dec) => {
              const isSelected = selectedDecision?.id === dec.id;
              return (
                <div
                  key={dec.id}
                  onClick={() => setSelectedDecision(dec)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'border-emerald-700 bg-white shadow-md ring-1 ring-emerald-700'
                      : 'border-stone-200 bg-white shadow-xs hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 text-xs">{dec.plotName}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        dec.priority === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : dec.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {dec.priority}
                    </span>
                  </div>

                  <div className="mt-2 text-xs font-semibold text-emerald-800">
                    {dec.recommendation.replace(/_/g, ' ')}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-stone-600 leading-relaxed">
                    {dec.reason}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2 text-[11px] text-stone-500">
                    <span>Confidence: {(dec.confidence * 100).toFixed(0)}%</span>
                    <span
                      className={`font-semibold ${
                        dec.status === 'APPROVED'
                          ? 'text-emerald-700'
                          : dec.status === 'REJECTED'
                          ? 'text-rose-600'
                          : 'text-amber-700'
                      }`}
                    >
                      {dec.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Evidence & Explainability Matrix (2 cols) */}
        <div className="space-y-5 lg:col-span-2">
          {selectedDecision ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
              {/* Header */}
              <div className="flex flex-col justify-between gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-stone-900">
                      {selectedDecision.plotName}
                    </h3>
                    <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-mono text-stone-600">
                      ID: {selectedDecision.id}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-emerald-800">
                    Outcome: {selectedDecision.recommendation.replace(/_/g, ' ')}
                  </div>
                  <p className="mt-1 text-xs text-stone-600 leading-relaxed">
                    {selectedDecision.reason}
                  </p>
                </div>

                {/* Status & Approval CTA */}
                <div className="flex items-center space-x-2">
                  {selectedDecision.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => onReject(selectedDecision.id)}
                        className="flex items-center space-x-1 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
                      >
                        <XCircle className="h-3.5 w-3.5 text-stone-500" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => onApprove(selectedDecision.id)}
                        className="flex items-center space-x-1 rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Approve Simulation</span>
                      </button>
                    </>
                  ) : (
                    <div className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700">
                      Action Status: {selectedDecision.status}
                    </div>
                  )}
                </div>
              </div>

              {/* Agronomic Decision Formula Breakdown */}
              <div className="mt-4 rounded-lg bg-stone-50 p-3.5 text-xs">
                <div className="font-semibold text-stone-800">
                  Mathematical Decision Formulation:
                </div>
                <div className="mt-1 font-mono text-[11px] text-stone-600">
                  Utility(U) = w_m · Deficit({(activePlot.targetMoistureRange.min - activePlot.currentMoisture).toFixed(1)}%) + w_kc · CropCoeff({activePlot.cropType}) - w_r · RainForecast({weather.forecastRainfallMmNext24h}mm)
                </div>
              </div>

              {/* Evidence Factors Table */}
              <div className="mt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Perceived Evidence & Input Telemetry
                </h4>

                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-stone-200 bg-stone-50/80 text-[10px] font-bold uppercase text-stone-500">
                      <tr>
                        <th className="py-2 px-3">Environmental Factor</th>
                        <th className="py-2 px-3">Measured Value</th>
                        <th className="py-2 px-3">Agronomic Interpretation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-700">
                      {selectedDecision.evidence.map((ev, i) => (
                        <tr key={i}>
                          <td className="py-2.5 px-3 font-semibold text-stone-900 capitalize">
                            {ev.factor.replace(/_/g, ' ')}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-emerald-800">
                            {ev.value} {ev.unit || ''}
                          </td>
                          <td className="py-2.5 px-3 text-stone-600">{ev.interpretation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Natural Language Agronomic Explanation */}
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-900">
                      Gemini Agricultural AI Rationale
                    </span>
                  </div>

                  <button
                    onClick={() => onExplainAI(selectedDecision.id)}
                    className="flex items-center space-x-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-emerald-800 shadow-2xs border border-emerald-300 hover:bg-emerald-50"
                  >
                    <span>Generate / Refresh Explanation</span>
                  </button>
                </div>

                <div className="mt-2.5 text-xs text-stone-700 leading-relaxed">
                  {selectedDecision.aiExplanation ? (
                    <p className="whitespace-pre-line">{selectedDecision.aiExplanation}</p>
                  ) : (
                    <p className="italic text-stone-500">
                      Click the button above to synthesize a natural-language agronomic explanation using Gemini AI or the deterministic rule validator.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 text-xs text-stone-400">
              Select an agent decision on the left to inspect its evidence and reasoning.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
