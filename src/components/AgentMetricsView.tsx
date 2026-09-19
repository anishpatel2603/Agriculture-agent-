import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Droplets,
  ShieldCheck,
  RefreshCw,
  Award,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { AgentPerformanceMetrics } from '../types';
import { api } from '../services/api';

export const AgentMetricsView: React.FC = () => {
  const [metrics, setMetrics] = useState<AgentPerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAgentMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load agent metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="agent-metrics-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-emerald-800" />
            <h2 className="text-lg font-bold text-stone-900">
              Autonomous Agent Performance & Safety Evaluation
            </h2>
          </div>
          <p className="text-xs text-stone-500">
            Systematic telemetry tracking reliability, anomaly detection rates, tool execution efficiency, and agronomic water conservation.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="flex items-center space-x-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-xs hover:bg-stone-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {!metrics ? (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-xs text-stone-500">
          Compiling agent performance metrics...
        </div>
      ) : (
        <>
          {/* Top Metric Cards (4 stats) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Cycles Completed */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs">
                <span>Cycles Completed</span>
                <Activity className="h-4 w-4 text-emerald-700" />
              </div>
              <div className="mt-2 text-2xl font-bold text-stone-900 font-mono">
                {metrics.cyclesCompleted.toLocaleString()}
              </div>
              <p className="mt-1 text-[11px] text-stone-500">Continuous 7-stage iterations</p>
            </div>

            {/* Tool Calls */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs">
                <span>Allowlisted Tool Invocations</span>
                <Cpu className="h-4 w-4 text-blue-700" />
              </div>
              <div className="mt-2 text-2xl font-bold text-stone-900 font-mono">
                {metrics.toolCallsCount.toLocaleString()}
              </div>
              <p className="mt-1 text-[11px] text-stone-500">Avg response: ~{metrics.avgResponseTimeMs}ms</p>
            </div>

            {/* Anomaly Detection */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs">
                <span>Telemetry Ingested</span>
                <ShieldCheck className="h-4 w-4 text-amber-700" />
              </div>
              <div className="mt-2 text-2xl font-bold text-stone-900 font-mono">
                {metrics.observationsProcessed.toLocaleString()}
              </div>
              <p className="mt-1 text-[11px] text-stone-500">
                {metrics.validReadingsCount} valid, {metrics.invalidReadingsCount} bounds checked
              </p>
            </div>

            {/* Water Conserved */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs">
                <span>Water Conserved (Liters)</span>
                <Droplets className="h-4 w-4 text-teal-700" />
              </div>
              <div className="mt-2 text-2xl font-bold text-teal-900 font-mono">
                {metrics.waterSavedLitersTotal.toLocaleString()} L
              </div>
              <p className="mt-1 text-[11px] text-stone-500">
                {(metrics.waterSavedLitersTotal / 100000).toFixed(2)} Lakh Liters conserved
              </p>
            </div>
          </div>

          {/* Detailed Metric Breakdowns */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Perception & Telemetry Safety Card */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-stone-800 border-b border-stone-100 pb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-800" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Perception Quality & Verification</h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-stone-600">Valid Ingested Readings</span>
                  <span className="font-bold text-emerald-800 font-mono">{metrics.validReadingsCount}</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (metrics.validReadingsCount / (metrics.observationsProcessed || 1)) * 100)}%`,
                    }}
                  ></div>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-stone-600">Anomalous / Out-of-Bounds Detections</span>
                  <span className="font-bold text-amber-800 font-mono">{metrics.invalidReadingsCount}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-stone-100 pt-2">
                  <span className="text-stone-600">Zero-Fabrication Guardrail Events (Missing NPK)</span>
                  <span className="font-bold text-rose-800 font-mono">{metrics.missingDataEventsCount}</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-normal">
                  Strictly prevents fabricated NPK or nutrient values when laboratory Soil Health Card tests have not been registered for a parcel.
                </p>
              </div>
            </div>

            {/* Human-in-the-Loop & Decision Safety Card */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-stone-800 border-b border-stone-100 pb-3">
                <ShieldCheck className="h-4 w-4 text-emerald-800" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Human-in-the-Loop Governance</h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-stone-600">Total Agronomic Recommendations</span>
                  <span className="font-bold text-stone-900 font-mono">{metrics.recommendationsCount}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-stone-600">Approved Simulated Executions (Level 4)</span>
                  <span className="font-bold text-emerald-800 font-mono">{metrics.approvedSimulationsCount}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-stone-600">Rejected Operator Proposals</span>
                  <span className="font-bold text-rose-800 font-mono">{metrics.rejectedSimulationsCount}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-stone-100 pt-2">
                  <span className="text-stone-600">Active Warning & Critical Alerts</span>
                  <span className="font-bold text-amber-800 font-mono">{metrics.activeAlertsCount}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-stone-600">Agent Uptime</span>
                  <span className="font-bold text-stone-700 font-mono">{Math.floor(metrics.uptimeSeconds / 60)}m {metrics.uptimeSeconds % 60}s</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
