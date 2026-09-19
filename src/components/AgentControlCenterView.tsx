import React, { useState } from 'react';
import {
  Cpu,
  Play,
  Pause,
  Zap,
  Activity,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Filter,
  Terminal,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Wrench,
  Droplets,
  Sparkles,
} from 'lucide-react';
import { AgentSystemStatus, AgentLogEntry, AgentDecision, FarmAction, Plot } from '../types';

interface AgentControlCenterViewProps {
  systemStatus: AgentSystemStatus;
  logs: AgentLogEntry[];
  decisions: AgentDecision[];
  actions: FarmAction[];
  plots: Plot[];
  onToggleSimulation: () => void;
  onChangeSpeed: (speed: number) => void;
  onTriggerCycle: () => void;
  onApproveDecision: (decisionId: string) => void;
  onRejectDecision: (decisionId: string, reason?: string) => void;
  onNavigateToTools?: () => void;
}

export const AgentControlCenterView: React.FC<AgentControlCenterViewProps> = ({
  systemStatus,
  logs,
  decisions,
  actions,
  plots,
  onToggleSimulation,
  onChangeSpeed,
  onTriggerCycle,
  onApproveDecision,
  onRejectDecision,
  onNavigateToTools,
}) => {
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warn' | 'decision' | 'action'>('all');
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

  const pipelineStages = [
    {
      id: 'PERCEIVE',
      name: '1. Perceive',
      desc: 'Ingest raw capacitive, thermal, and IMD meteorological telemetry',
      color: 'border-blue-300 text-blue-800 bg-blue-50',
    },
    {
      id: 'UPDATE_STATE',
      name: '2. Update State',
      desc: 'Synchronize 4-parcel Indian farm model and environmental memory',
      color: 'border-cyan-300 text-cyan-800 bg-cyan-50',
    },
    {
      id: 'ANALYZE',
      name: '3. Analyze',
      desc: 'Validate bounds, detect anomalies, screen zero-fabrication nutrient rules',
      color: 'border-amber-300 text-amber-800 bg-amber-50',
    },
    {
      id: 'PLAN',
      name: '4. Plan',
      desc: 'Compute utility function factoring ICAR crop Kc and IMD rainfall probability',
      color: 'border-purple-300 text-purple-800 bg-purple-50',
    },
    {
      id: 'VALIDATE',
      name: '5. Validate',
      desc: 'Enforce safety checks (rainfall lockout, pump limits, human approval gate)',
      color: 'border-emerald-300 text-emerald-800 bg-emerald-50',
    },
    {
      id: 'ACT',
      name: '6. Act',
      desc: 'Dispatch simulated precision irrigation actuators and field alerts',
      color: 'border-rose-300 text-rose-800 bg-rose-50',
    },
    {
      id: 'FEEDBACK',
      name: '7. Feedback',
      desc: 'Track soil moisture replenishment trajectory and compute water conservation',
      color: 'border-teal-300 text-teal-800 bg-teal-50',
    },
  ];

  const pendingDecisions = decisions.filter((d) => d.status === 'PENDING' && d.suggestedAction);
  const runningActions = actions.filter((a) => a.executionStatus === 'RUNNING');

  const filteredLogs = logs.filter((log) => {
    if (filterLevel === 'all') return true;
    return log.level === filterLevel;
  });

  return (
    <div id="agent-control-center-view" className="space-y-6">
      {/* Top Banner: Agent Operational Status & Primary Loop Controls */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-emerald-800" />
            <h2 className="text-lg font-bold text-stone-900">
              Autonomous Agent Control Center
            </h2>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
              {systemStatus.executionMode || 'SIMULATION_APPROVAL'} MODE
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            The central decision-making engine governing Indian farm parcels, telemetry validation, and precision actuator loops.
          </p>
        </div>

        {/* Speed & Execution Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 rounded-lg border border-stone-200 bg-stone-50 p-1 text-xs">
            <button
              onClick={onToggleSimulation}
              className={`flex items-center space-x-1 rounded px-3 py-1.5 font-medium transition-colors ${
                systemStatus.isSimulating
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  : 'bg-emerald-800 text-white hover:bg-emerald-700'
              }`}
            >
              {systemStatus.isSimulating ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause Agent Loop</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>Start Autonomous Loop</span>
                </>
              )}
            </button>

            <span className="text-stone-300 px-1">|</span>

            <span className="text-stone-500 text-[11px] font-medium px-1">Speed:</span>
            {[1, 2, 5, 10].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`rounded px-2 py-1 text-[11px] font-bold ${
                  systemStatus.simulationSpeed === spd
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            onClick={onTriggerCycle}
            className="flex items-center space-x-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 shadow-xs hover:bg-stone-50"
          >
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            <span>Force Single Step</span>
          </button>

          {onNavigateToTools && (
            <button
              onClick={onNavigateToTools}
              className="flex items-center space-x-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 shadow-xs hover:bg-emerald-100"
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>Tool Workbench</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-time Agent State Bar */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Active Agent Task</span>
            <p className="mt-0.5 text-xs font-bold text-stone-900 truncate">
              {systemStatus.currentTask || 'Environmental Monitoring & Irrigation Planning'}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Last Observation</span>
            <p className="mt-0.5 text-xs font-medium text-stone-700 truncate">
              {systemStatus.lastObservation || 'All 4 Indian agro-ecological parcels nominal'}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Power Feeder Status</span>
            <p className="mt-0.5 text-xs font-bold text-emerald-800 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
              {systemStatus.powerFeederStatus || '3-Phase Active'}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Conserved Water</span>
            <p className="mt-0.5 text-xs font-bold text-teal-800 flex items-center gap-1">
              <Droplets className="h-3.5 w-3.5 text-teal-600" />
              {systemStatus.waterSavedTotalLiters.toLocaleString()} Liters ({(systemStatus.waterSavedTotalLiters / 100000).toFixed(2)} Lakh L)
            </p>
          </div>
        </div>
      </div>

      {/* Visual 7-Stage Agent Pipeline */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700">
              Autonomous Agent Decision Loop
            </h3>
            <span className="font-mono text-xs text-stone-500">
              [Cycle #{systemStatus.currentCycle}]
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
            </span>
            <span className="font-semibold text-emerald-800">
              Active Stage: {systemStatus.currentStage}
            </span>
          </div>
        </div>

        {/* Pipeline Stage Cards */}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {pipelineStages.map((st) => {
            const isCurrent = systemStatus.currentStage === st.id;
            return (
              <div
                key={st.id}
                className={`relative flex flex-col justify-between rounded-lg border p-3 text-xs transition-all ${
                  isCurrent
                    ? `${st.color} ring-2 ring-emerald-600 shadow-md`
                    : 'border-stone-200 bg-stone-50/70 text-stone-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{st.name}</span>
                    {isCurrent && (
                      <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] leading-snug text-stone-500">{st.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Approval Queue (Human-in-the-Loop Gate) */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-800" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700">
              Human-in-the-Loop Safety Approval Queue (Level 3 Gate)
            </h3>
          </div>
          <span className="text-xs font-semibold text-stone-500">
            {pendingDecisions.length} pending authorization
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {pendingDecisions.length === 0 ? (
            <div className="py-6 text-center text-xs text-stone-400">
              No pending actuator actions awaiting human approval. All farm parcels operate safely within parameters.
            </div>
          ) : (
            pendingDecisions.map((dec) => (
              <div
                key={dec.id}
                className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-2">
                  <div>
                    <span className="font-bold text-stone-900 text-sm">{dec.recommendation}</span>
                    <div className="text-[11px] text-stone-600 mt-0.5">
                      Target Parcel: <strong className="text-stone-900">{dec.plotName}</strong> | Priority: <strong className="text-amber-800">{dec.priority}</strong>
                    </div>
                  </div>
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    Confidence: {(dec.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="mt-2 text-stone-700 leading-relaxed">
                  <strong>Evidence & Telemetry:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                    {dec.evidence.map((ev, i) => (
                      <li key={i}>
                        <span className="font-semibold">{ev.factor}:</span> {ev.interpretation} ({ev.value}{ev.unit ? ' ' + ev.unit : ''})
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Approve / Reject Controls */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-100">
                  <div className="text-[11px] text-stone-500">
                    Safety Level: <strong>Level 3 Human Authorization Required</strong> before simulated execution.
                  </div>

                  <div className="flex items-center space-x-2">
                    {showRejectInput === dec.id ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          placeholder="Rejection reason..."
                          value={rejectReason[dec.id] || ''}
                          onChange={(e) =>
                            setRejectReason({ ...rejectReason, [dec.id]: e.target.value })
                          }
                          className="rounded border border-stone-300 px-2 py-1 text-xs"
                        />
                        <button
                          onClick={() => {
                            onRejectDecision(dec.id, rejectReason[dec.id]);
                            setShowRejectInput(null);
                          }}
                          className="rounded bg-rose-700 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-800"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setShowRejectInput(null)}
                          className="rounded bg-stone-200 px-2 py-1 text-xs text-stone-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowRejectInput(dec.id)}
                        className="flex items-center space-x-1 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        <span>Reject Proposal</span>
                      </button>
                    )}

                    <button
                      onClick={() => onApproveDecision(dec.id)}
                      className="flex items-center space-x-1 rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>Authorize Simulated Execution</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Real-time Agent Event Log Stream */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2">
            <Terminal className="h-4 w-4 text-emerald-800" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700">
              Agent Perception & Action Event Stream
            </h3>
          </div>

          {/* Level Filter */}
          <div className="flex items-center space-x-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-stone-400" />
            {(['all', 'info', 'warn', 'decision', 'action'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`rounded-md px-2.5 py-1 capitalize text-[11px] font-medium transition-colors ${
                  filterLevel === lvl
                    ? 'bg-emerald-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Log Entries Container */}
        <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              No log events recorded matching the current filter.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start space-x-3 rounded-lg border border-stone-100 bg-stone-50 p-2.5 text-xs font-mono transition-colors hover:bg-stone-100/60"
              >
                <span className="shrink-0 text-[10px] text-stone-600">
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>

                <span
                  className={`shrink-0 rounded px-1.5 py-0.2 text-[10px] font-bold ${
                    log.level === 'action'
                      ? 'bg-emerald-100 text-emerald-900'
                      : log.level === 'decision'
                      ? 'bg-blue-100 text-blue-900'
                      : log.level === 'warn'
                      ? 'bg-rose-100 text-rose-900'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {log.stage}
                </span>

                <span className="flex-1 text-stone-800 leading-relaxed">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
