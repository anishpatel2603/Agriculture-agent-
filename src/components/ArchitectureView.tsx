import React from 'react';
import {
  Network,
  Radio,
  CheckCircle2,
  Database,
  Cpu,
  ShieldCheck,
  Zap,
  RotateCcw,
  Bot,
  ArrowDown,
  Layers,
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const layers = [
    {
      title: '1. Physical & Simulated Perception Layer',
      icon: Radio,
      badge: 'Input Hardware / Sim',
      desc: 'Capacitive FMCW soil probes, DS18B20 digital thermometers, SHT31 humidity sensors, and meteorological rain gauges.',
      details: 'Continuously measures volumetric water content, soil temperature, and atmospheric evaporative demand every 3.5 seconds.',
    },
    {
      title: '2. Ingestion, Quality Validation & Sanitization',
      icon: CheckCircle2,
      badge: 'Data Integrity Filter',
      desc: 'Filters physical noise, checks timestamp freshness (<10 min), and flags out-of-bounds readings (>100% or <0%).',
      details: 'Prevents corrupted sensor data from propagating into agricultural decisions. Automatically tags readings as Valid, Stale, or Anomalous.',
    },
    {
      title: '3. Internal Agronomic World Model (State Store)',
      icon: Database,
      badge: 'Epistemic Memory',
      desc: 'Tracks plot zones, crop type, root depth, growth stages, soil hydraulic holding capacity, and actuator telemetry history.',
      details: 'Maintains state continuity across cycles, preventing reactive oscillation and memory loss.',
    },
    {
      title: '4. Reactive Anomaly Detection Engine',
      icon: Cpu,
      badge: 'Fast Rule Filter',
      desc: 'Monitors real-time thresholds for rapid alerting on extreme desiccation, severe root-zone waterlogging, or sudden sensor disconnection.',
      details: 'Operates concurrently to generate immediate operator alerts with zero latency before deliberative planning.',
    },
    {
      title: '5. Deliberative Decision & Utility Engine',
      icon: Layers,
      badge: 'Multi-Factor Optimization',
      desc: 'Computes multi-attribute utility: U = f(Moisture Deficit, Crop Kc, Soil Infiltration, Rain Forecast, Evapotranspiration).',
      details: 'Determines whether irrigation is truly needed, calculates required water volume in liters, and defers if precipitation is imminent.',
    },
    {
      title: '6. Action Safety Validator & Human-in-the-Loop',
      icon: ShieldCheck,
      badge: 'Deterministic Safety Guardrail',
      desc: 'Enforces hard boundaries: 30-minute minimum interval between cycles, pump over-saturation lockout, and mandatory operator approval.',
      details: 'Guarantees that no physical or simulated actuator runs without satisfying agronomic safety invariants.',
    },
    {
      title: '7. Actuator Driver & Execution Adapter',
      icon: Zap,
      badge: 'Physical / Simulated Output',
      desc: 'Translates high-level irrigation decisions into simulated solenoid pulse commands and REST/MQTT packets.',
      details: 'Tracks active valve runtime and terminates automatically upon duration expiration or emergency stop trigger.',
    },
    {
      title: '8. Closed-Loop Feedback & Verification Layer',
      icon: RotateCcw,
      badge: 'Observational Verification',
      desc: 'Monitors post-irrigation soil moisture response over subsequent cycles to verify expected hydraulic recharge.',
      details: 'Calculates net water conservation delta against static timer baselines and logs audit metrics.',
    },
    {
      title: '9. Presentation & Grounded Gemini Copilot',
      icon: Bot,
      badge: 'Human Interface & AI Explanation',
      desc: 'Interactive React dashboard with live telemetry charts, audit logs, scenario benches, and grounded conversational Gemini 3.8 Flash explanations.',
      details: 'Exposes clear reasoning for every autonomous action while maintaining strict academic transparency.',
    },
  ];

  return (
    <div id="architecture-view" className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-center space-x-2">
          <Network className="h-5 w-5 text-emerald-800" />
          <h2 className="text-lg font-bold text-stone-900">
            System Architecture & Data Flow Pipeline
          </h2>
        </div>
        <p className="mt-1 text-xs text-stone-500 leading-relaxed">
          The AgroGenesis architecture is designed as a hybrid intelligent system. It separates critical actuation logic into deterministic, safety-bounded rules while utilizing Google Gemini for multi-modal crop vision and grounded natural-language explanations.
        </p>
      </div>

      {/* Layer-by-Layer Architectural Pipeline */}
      <div className="space-y-3">
        {layers.map((layer, idx) => {
          const Icon = layer.icon;
          return (
            <div key={idx} className="relative">
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">{layer.title}</h3>
                      <p className="text-xs text-stone-600">{layer.desc}</p>
                    </div>
                  </div>

                  <span className="self-start sm:self-center rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold font-mono text-stone-700">
                    {layer.badge}
                  </span>
                </div>

                <div className="mt-3 rounded-lg bg-stone-50 p-2.5 text-xs text-stone-600 border border-stone-100">
                  <strong className="text-stone-800">Operational Invariant: </strong>
                  {layer.details}
                </div>
              </div>

              {idx < layers.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="h-4 w-4 text-stone-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
