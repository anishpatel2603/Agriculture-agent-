import React, { useState, useEffect } from 'react';
import {
  Brain,
  Database,
  Calendar,
  History,
  MapPin,
  Sprout,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Layers,
  Sparkles,
  Award,
} from 'lucide-react';
import { AgentMemory } from '../types';
import { api } from '../services/api';

export const AgentMemoryInspectorView: React.FC = () => {
  const [memory, setMemory] = useState<AgentMemory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'SHORT_TERM' | 'EPISODIC' | 'SEMANTIC'>('SHORT_TERM');

  const fetchMemory = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAgentMemory();
      setMemory(data);
    } catch (err) {
      console.error('Failed to load agent memory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemory();
  }, []);

  return (
    <div id="agent-memory-inspector" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-emerald-800" />
            <h2 className="text-lg font-bold text-stone-900">
              Agent Memory Inspector (Tripartite Cognitive Architecture)
            </h2>
          </div>
          <p className="text-xs text-stone-500">
            Autonomous agent working state partitioned into Short-Term (operational), Episodic (experiential), and Semantic (knowledge base).
          </p>
        </div>

        <button
          onClick={fetchMemory}
          className="flex items-center space-x-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-xs hover:bg-stone-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Memory State</span>
        </button>
      </div>

      {/* Memory Tab Selector */}
      <div className="flex border-b border-stone-200 bg-white px-4 pt-2 rounded-t-xl">
        <button
          onClick={() => setActiveTab('SHORT_TERM')}
          className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
            activeTab === 'SHORT_TERM'
              ? 'border-emerald-800 text-emerald-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Short-Term Working Memory</span>
        </button>

        <button
          onClick={() => setActiveTab('EPISODIC')}
          className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
            activeTab === 'EPISODIC'
              ? 'border-emerald-800 text-emerald-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Episodic Memory & Event History</span>
        </button>

        <button
          onClick={() => setActiveTab('SEMANTIC')}
          className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
            activeTab === 'SEMANTIC'
              ? 'border-emerald-800 text-emerald-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Semantic & Domain Agronomic Knowledge</span>
        </button>
      </div>

      {/* Content Panes */}
      {!memory ? (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-xs text-stone-500">
          Loading agent cognitive state...
        </div>
      ) : activeTab === 'SHORT_TERM' ? (
        <div className="space-y-6">
          {/* Current Working Task */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-900">
              <Sparkles className="h-4 w-4 text-emerald-700" />
              <span>Current Agent Focus Task</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-emerald-950">{memory.shortTerm.currentTask}</p>
            {memory.shortTerm.currentActionStatus && (
              <span className="mt-2 inline-block rounded bg-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-900">
                Active Actuation: {memory.shortTerm.currentActionStatus}
              </span>
            )}
          </div>

          {/* Recent Parcel Observations */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 mb-3">
              Live Perception Observations Buffer
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {memory.shortTerm.recentObservations.map((obs) => (
                <div key={obs.plotId} className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs">
                  <div className="flex items-center justify-between font-bold text-stone-900">
                    <span>{obs.plotName}</span>
                    <span className="font-mono text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                      {obs.qualityStatus}
                    </span>
                  </div>
                  <p className="mt-1 text-stone-600 leading-relaxed">{obs.observation}</p>
                  <div className="mt-2 text-[10px] text-stone-400 font-mono">
                    Observed at: {new Date(obs.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Latest Telemetry Values */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 mb-3">
              Ingested Telemetry Stream
            </h3>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold text-stone-600">
                  <tr>
                    <th className="py-2 px-3">Plot</th>
                    <th className="py-2 px-3">Sensor</th>
                    <th className="py-2 px-3">Value</th>
                    <th className="py-2 px-3">Quality</th>
                    <th className="py-2 px-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                  {memory.shortTerm.latestReadings.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 px-3 text-stone-800">{r.plotId}</td>
                      <td className="py-2 px-3 text-stone-600">{r.sensorType}</td>
                      <td className="py-2 px-3 font-bold text-stone-900">{r.value} {r.unit}</td>
                      <td className="py-2 px-3">
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          {r.qualityStatus}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-stone-400">{new Date(r.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'EPISODIC' ? (
        <div className="space-y-6">
          {/* Approved vs Rejected Actions */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Approved Actions */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
              <div className="flex items-center space-x-2 text-emerald-800 mb-3">
                <CheckCircle className="h-4 w-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Approved Actions Log</h3>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {memory.episodic.approvedActions.length === 0 ? (
                  <p className="text-xs text-stone-400 py-4 text-center">No actions approved yet.</p>
                ) : (
                  memory.episodic.approvedActions.map((act) => (
                    <div key={act.id} className="rounded-lg border border-stone-100 bg-stone-50 p-2.5 text-xs">
                      <div className="flex items-center justify-between font-bold text-stone-900">
                        <span>{act.actionType}</span>
                        <span className="text-[10px] font-mono text-emerald-800">{act.executionStatus}</span>
                      </div>
                      <div className="text-[11px] text-stone-600 mt-1">Plot: {act.plotName}</div>
                      <div className="text-[10px] text-stone-400 mt-1">
                        Dispatched: {new Date(act.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Rejected Actions */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
              <div className="flex items-center space-x-2 text-rose-800 mb-3">
                <XCircle className="h-4 w-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Rejected Actions & Farmer Feedback</h3>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {memory.episodic.rejectedActions.length === 0 ? (
                  <p className="text-xs text-stone-400 py-4 text-center">No operator rejections recorded.</p>
                ) : (
                  memory.episodic.rejectedActions.map((rej, i) => (
                    <div key={i} className="rounded-lg border border-rose-100 bg-rose-50/50 p-2.5 text-xs">
                      <div className="font-bold text-rose-950">{rej.plotName}</div>
                      <p className="mt-1 text-[11px] text-stone-700">Reason: {rej.reason || 'Operator declined recommendation'}</p>
                      <div className="mt-1 text-[10px] text-stone-400 font-mono">
                        {new Date(rej.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Irrigation & Water Feedback Events */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 mb-3">
              Actuator Feedback & Water Conservation History
            </h3>
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold text-stone-600">
                  <tr>
                    <th className="py-2 px-3">Date/Time</th>
                    <th className="py-2 px-3">Plot</th>
                    <th className="py-2 px-3">Initial Moisture</th>
                    <th className="py-2 px-3">Final Moisture</th>
                    <th className="py-2 px-3">Volume Dispatched</th>
                    <th className="py-2 px-3">Water Saved (Est.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                  {memory.episodic.irrigationEvents.map((evt) => (
                    <tr key={evt.id}>
                      <td className="py-2 px-3 text-stone-500">{new Date(evt.timestamp).toLocaleString()}</td>
                      <td className="py-2 px-3 font-bold text-stone-900">{evt.plotName}</td>
                      <td className="py-2 px-3 text-stone-700">{evt.initialMoisture}%</td>
                      <td className="py-2 px-3 font-bold text-emerald-800">{evt.finalMoisture ?? '—'}%</td>
                      <td className="py-2 px-3 text-stone-700">{evt.volumeLiters.toLocaleString()} L</td>
                      <td className="py-2 px-3 font-bold text-emerald-700">{evt.waterSavedEstLiters?.toLocaleString() || 800} L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Semantic Knowledge Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Indian Farm Identity */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
              <div className="flex items-center space-x-2 text-emerald-800 mb-3">
                <MapPin className="h-4 w-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Regional Agro-Ecological Context</h3>
              </div>
              <div className="space-y-2 text-xs text-stone-700">
                <div className="flex justify-between border-b border-stone-100 py-1">
                  <span className="font-medium text-stone-500">Location:</span>
                  <span className="font-bold">{memory.semantic.farmDetails.district}, {memory.semantic.farmDetails.state} 🇮🇳</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 py-1">
                  <span className="font-medium text-stone-500">Agro-Climatic Zone:</span>
                  <span className="font-bold text-right">{memory.semantic.farmDetails.agroClimaticZone}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 py-1">
                  <span className="font-medium text-stone-500">Cropping Season:</span>
                  <span className="font-bold text-emerald-800">{memory.semantic.farmDetails.season} Season</span>
                </div>
              </div>
            </div>

            {/* Knowledge Base Metrics */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
              <div className="flex items-center space-x-2 text-purple-800 mb-3">
                <Award className="h-4 w-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Agronomic Standards & Reference Profiles</h3>
              </div>
              <div className="space-y-2 text-xs text-stone-700">
                <div className="flex justify-between border-b border-stone-100 py-1">
                  <span className="font-medium text-stone-500">Supported Indian Crops:</span>
                  <span className="font-bold text-purple-900">{memory.semantic.supportedCropsCount} Crops (ICAR Models)</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 py-1">
                  <span className="font-medium text-stone-500">Soil Characterization Profiles:</span>
                  <span className="font-bold text-purple-900">{memory.semantic.soilProfilesCount} Indian Soil Classes</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 py-1">
                  <span className="font-medium text-stone-500">Rainfall Pump Lockout:</span>
                  <span className="font-bold text-rose-800">≥ {memory.semantic.userPreferences.autoLockoutOnRainfallMm} mm / 24h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reference Standards */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 mb-2">
              Domain Reference Protocols
            </h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-stone-600">
              {memory.semantic.referenceStandards.map((std, i) => (
                <li key={i}>{std}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
