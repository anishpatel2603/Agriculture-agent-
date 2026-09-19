import React from 'react';
import {
  History,
  Droplet,
  CheckCircle2,
  XOctagon,
  Clock,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { FarmAction } from '../types';

interface ActionHistoryViewProps {
  actions: FarmAction[];
  onStopAction: (actionId: string) => void;
}

export const ActionHistoryView: React.FC<ActionHistoryViewProps> = ({
  actions,
  onStopAction,
}) => {
  return (
    <div id="action-history-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-emerald-800" />
            <h2 className="text-lg font-bold text-stone-900">
              Actuator Execution & Feedback Audit Trail
            </h2>
          </div>
          <p className="text-xs text-stone-500">
            Immutable log of simulated irrigation pulses, volumetric delivery, and measured soil moisture delta.
          </p>
        </div>
      </div>

      {/* Execution Audit Table */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700">
          Action Execution History ({actions.length})
        </h3>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50 text-[10px] font-bold uppercase text-stone-500">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Target Plot</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Duration / Volume</th>
                <th className="py-2.5 px-3">Feedback (Pre → Post Moisture)</th>
                <th className="py-2.5 px-3">Trigger Mode</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {actions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-stone-400">
                    No actuator events recorded yet. Approve a pending decision or trigger a manual pulse.
                  </td>
                </tr>
              ) : (
                actions.map((act) => (
                  <tr key={act.id} className="hover:bg-stone-50/70">
                    <td className="py-3 px-3 font-mono text-stone-500">
                      {new Date(act.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 font-semibold text-stone-900">{act.plotName}</td>
                    <td className="py-3 px-3 font-medium text-emerald-800">
                      {act.actionType.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-3">
                      <div>{act.parameters.durationMinutes || 15} minutes</div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        ~{((act.parameters.durationMinutes || 15) * (act.parameters.rateLitersPerMin || 120)).toLocaleString()} L
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1.5 font-mono">
                        <span className="text-stone-600">{act.initialMoisture?.toFixed(1)}%</span>
                        <ArrowRight className="h-3 w-3 text-emerald-600" />
                        <span className="font-bold text-emerald-700">
                          {act.finalMoisture ? `${act.finalMoisture.toFixed(1)}%` : 'In Progress'}
                        </span>
                      </div>
                      {act.finalMoisture && act.initialMoisture && (
                        <div className="text-[10px] text-emerald-700 font-medium">
                          +{(act.finalMoisture - act.initialMoisture).toFixed(1)}% Moisture Gain
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-mono text-stone-700">
                        {act.approvalStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          act.executionStatus === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : act.executionStatus === 'RUNNING'
                            ? 'bg-blue-100 text-blue-800 animate-pulse'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {act.executionStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {act.executionStatus === 'RUNNING' ? (
                        <button
                          onClick={() => onStopAction(act.id)}
                          className="flex items-center space-x-1 rounded bg-rose-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-rose-800"
                        >
                          <XOctagon className="h-3 w-3" />
                          <span>Emergency Stop</span>
                        </button>
                      ) : (
                        <span className="text-stone-400 text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
