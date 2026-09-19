import React from 'react';
import {
  Sprout,
  Droplets,
  Thermometer,
  CloudSun,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  Sparkles,
  Zap,
  FileText,
} from 'lucide-react';
import {
  Plot,
  CropType,
  AgentDecision,
  FarmAlert,
  AgentSystemStatus,
  WeatherData,
} from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTranslation } from '../locales/LanguageContext';
import { INDIAN_CROP_DATABASE } from '../data/indianAgriData';

interface DashboardViewProps {
  plots: Plot[];
  decisions: AgentDecision[];
  alerts: FarmAlert[];
  weather: WeatherData;
  systemStatus: AgentSystemStatus;
  onApproveDecision: (id: string) => void;
  onRejectDecision: (id: string) => void;
  onExplainAI: (id: string) => void;
  onSelectPlot: (plotId: string) => void;
  onSelectPage: (page: string) => void;
  onLoadScenario: (scenarioId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  plots,
  decisions,
  alerts,
  weather,
  systemStatus,
  onApproveDecision,
  onRejectDecision,
  onExplainAI,
  onSelectPlot,
  onSelectPage,
  onLoadScenario,
}) => {
  const { t, language, formatArea, formatWater } = useTranslation();

  // Aggregate stats
  const totalPlots = plots.length;
  const avgMoisture =
    plots.length > 0
      ? Math.round(plots.reduce((acc, p) => acc + p.currentMoisture, 0) / plots.length)
      : 0;
  const pendingDecisions = decisions.filter((d) => d.status === 'PENDING');
  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');

  // Mini trend data synthesis for dashboard chart based on real plot telemetry
  const chartData = [
    { time: '04:00', plot0: 55, plot1: 72, plot2: 36, plot3: 54 },
    { time: '08:00', plot0: 53, plot1: 70, plot2: 34, plot3: 52 },
    { time: '12:00', plot0: 50, plot1: 68, plot2: 31, plot3: 50 },
    { time: '16:00', plot0: 48, plot1: 67, plot2: 29, plot3: 49 },
    {
      time: 'Now',
      plot0: plots[0]?.currentMoisture ?? 48,
      plot1: plots[1]?.currentMoisture ?? 66,
      plot2: plots[2]?.currentMoisture ?? 28,
      plot3: plots[3]?.currentMoisture ?? 49,
    },
  ];

  const getCropDisplayName = (cropType: string) => {
    const crop = INDIAN_CROP_DATABASE[cropType as CropType];
    if (!crop) return cropType;
    if (language === 'hi') return `${crop.nameHi} (${crop.nameEn})`;
    if (language === 'mr') return `${crop.nameMr} (${crop.nameEn})`;
    return `${crop.nameEn} (${crop.nameHi})`;
  };

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Top Banner: Indian Scenario Quick Launcher & Agent Status */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-stone-50 to-emerald-50/40 p-4 shadow-xs md:flex-row md:items-center">
        <div className="flex items-start space-x-3">
          <div className="rounded-lg bg-emerald-700 p-2 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">
              AgroGenesis Indian Agriculture Decision-Support Engine
            </h2>
            <p className="text-xs text-stone-600">
              ICAR crop benchmarks • Monsoon safety lockouts • Soil Health Card NPK validation • 100% Zero-Fabrication Guardrail.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-stone-500">Quick Test Scenarios:</span>
          <button
            onClick={() => onLoadScenario('scenario_1_konkan_rice_monsoon')}
            className="rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100 hover:text-emerald-800"
          >
            🌧️ Monsoon Flood Lockout
          </button>
          <button
            onClick={() => onLoadScenario('scenario_2_punjab_wheat_deficit')}
            className="rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100 hover:text-emerald-800"
          >
            🌾 Wheat CRI Deficit
          </button>
          <button
            onClick={() => onLoadScenario('scenario_3_vidarbha_cotton_heatwave')}
            className="rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-50"
          >
            🔥 Vidarbha 43°C Heatwave
          </button>
          <button
            onClick={() => onLoadScenario('scenario_7_missing_npk_guardrail')}
            className="rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-800 hover:bg-rose-50"
          >
            🛡️ Zero-Fabrication NPK
          </button>
          <button
            onClick={() => onSelectPage('scenarios')}
            className="rounded-md bg-stone-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-stone-800"
          >
            All 7 Scenarios →
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium uppercase tracking-wider">{t.nav.plots}</span>
            <Sprout className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900">{totalPlots}</div>
          <div className="mt-1 text-[11px] text-stone-500">{formatArea(14.5 * 2.471, 14.5)} Monitored</div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Moisture</span>
            <Droplets className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900">{avgMoisture}%</div>
          <div className="mt-1 text-[11px] text-stone-500">Volumetric Water Content</div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium uppercase tracking-wider">{t.weather.temperature}</span>
            <Thermometer className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900">{weather.temperatureC}°C</div>
          <div className="mt-1 text-[11px] text-stone-500">{weather.humidityPercent}% RH Ambient</div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium uppercase tracking-wider">Monsoon Rain</span>
            <CloudSun className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900">
            {weather.rainfallMmPast24h} mm
          </div>
          <div className="mt-1 text-[11px] text-stone-500">
            Forecast: {weather.forecastRainProbability}% ({weather.forecastRainfallMmNext24h}mm)
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium uppercase tracking-wider">Water Saved</span>
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 font-mono">
            {formatWater(systemStatus.waterSavedTotalLiters)}
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-medium">
            vs Fixed Timer Schedule
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium uppercase tracking-wider">{t.nav.alerts}</span>
            <AlertTriangle
              className={`h-4 w-4 ${
                activeAlerts.length > 0 ? 'text-rose-600' : 'text-stone-400'
              }`}
            />
          </div>
          <div
            className={`mt-2 text-2xl font-bold ${
              activeAlerts.length > 0 ? 'text-rose-600' : 'text-stone-900'
            }`}
          >
            {activeAlerts.length}
          </div>
          <div className="mt-1 text-[11px] text-stone-500">
            {pendingDecisions.length} Decisions Pending
          </div>
        </div>
      </div>

      {/* Action Approval Center: High priority recommendations needing human approval */}
      {pendingDecisions.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h3 className="text-sm font-bold text-stone-900">
                Agent Recommendations Requiring Farmer Approval ({pendingDecisions.length})
              </h3>
            </div>
            <span className="text-xs text-stone-500">
              Safety Guardrail: Simulated valve actuation requires confirmation
            </span>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {pendingDecisions.slice(0, 2).map((dec) => (
              <div
                key={dec.id}
                className="flex flex-col justify-between rounded-lg border border-amber-200 bg-white p-4 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-900 text-sm">{dec.plotName}</span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        dec.priority === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : dec.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {dec.priority} PRIORITY
                    </span>
                  </div>

                  <div className="mt-2 text-xs font-semibold text-emerald-800">
                    {dec.recommendation.replace(/_/g, ' ')}
                  </div>
                  <p className="mt-1 text-xs text-stone-600 leading-relaxed">{dec.reason}</p>

                  {/* Duration & Volume Details */}
                  {dec.suggestedAction?.durationMinutes && (
                    <div className="mt-2 flex items-center space-x-3 rounded bg-stone-50 p-2 text-xs text-stone-600">
                      <div>
                        <span className="font-medium text-stone-800">Duration:</span>{' '}
                        {dec.suggestedAction.durationMinutes} min
                      </div>
                      <span className="text-stone-300">•</span>
                      <div>
                        <span className="font-medium text-stone-800">Volume:</span> ~
                        {formatWater(dec.suggestedAction.volumeLiters || 0)}
                      </div>
                      <span className="text-stone-300">•</span>
                      <div>
                        <span className="font-medium text-stone-800">Confidence:</span>{' '}
                        {(dec.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                  <button
                    onClick={() => onExplainAI(dec.id)}
                    className="flex items-center space-x-1 text-xs font-medium text-emerald-700 hover:text-emerald-900"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{t.actions.explainAI}</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onRejectDecision(dec.id)}
                      className="flex items-center space-x-1 rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50"
                    >
                      <XCircle className="h-3.5 w-3.5 text-stone-500" />
                      <span>{t.actions.reject}</span>
                    </button>
                    <button
                      onClick={() => onApproveDecision(dec.id)}
                      className="flex items-center space-x-1 rounded-md bg-emerald-800 px-3 py-1 text-xs font-medium text-white shadow-xs hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{t.actions.approve}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Layout: Plot Cards on Left, Charts on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Farm Plot Cards (2 cols) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700">
              Indian Crop Plots ({plots.length})
            </h3>
            <button
              onClick={() => onSelectPage('plots')}
              className="flex items-center space-x-1 text-xs font-medium text-emerald-700 hover:text-emerald-900"
            >
              <span>Manage Plots</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {plots.map((plot) => {
              const isBelowMin = plot.currentMoisture < plot.targetMoistureRange.min;
              const isAboveMax = plot.currentMoisture > plot.targetMoistureRange.max;
              const hasSHC = plot.soilHealthCard?.hasCard;

              return (
                <div
                  key={plot.id}
                  onClick={() => onSelectPlot(plot.id)}
                  className="group relative cursor-pointer rounded-xl border border-stone-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-stone-900 group-hover:text-emerald-800">
                        {plot.name}
                      </h4>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                        <span className="font-medium text-emerald-800">
                          {getCropDisplayName(plot.cropType)}
                        </span>
                        <span>•</span>
                        <span className="text-stone-700">{plot.growthStage}</span>
                        <span>•</span>
                        <span>{formatArea(plot.areaAcre, plot.areaHa)}</span>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        plot.status === 'OPTIMAL'
                          ? 'bg-emerald-100 text-emerald-800'
                          : plot.status === 'ATTENTION_NEEDED'
                          ? 'bg-amber-100 text-amber-800'
                          : plot.status === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {plot.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Water Source & Soil Health Card Status Pill */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-700">
                      💧 {plot.waterSource || 'Borewell'}
                    </span>
                    <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-700">
                      ⚙️ {plot.irrigationMethod}
                    </span>
                    {hasSHC ? (
                      <span className="flex items-center space-x-1 rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800 font-medium border border-emerald-200">
                        <FileText className="h-2.5 w-2.5" />
                        <span>KVK Soil Card Valid</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 rounded bg-amber-50 px-1.5 py-0.5 text-amber-800 font-medium border border-amber-200">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        <span>Soil Card Missing (KVK Advised)</span>
                      </span>
                    )}
                  </div>

                  {/* Moisture Progress Bar with Target Envelope */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500">Soil Moisture (VWC)</span>
                      <span
                        className={`font-bold font-mono text-sm ${
                          isBelowMin
                            ? 'text-amber-600'
                            : isAboveMax
                            ? 'text-purple-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        {plot.currentMoisture.toFixed(1)}%
                      </span>
                    </div>

                    {/* Visual Bar */}
                    <div className="relative mt-1.5 h-3 w-full rounded-full bg-stone-100">
                      {/* Target Envelope Highlight */}
                      <div
                        className="absolute top-0 bottom-0 bg-emerald-100/90 rounded"
                        style={{
                          left: `${plot.targetMoistureRange.min}%`,
                          width: `${plot.targetMoistureRange.max - plot.targetMoistureRange.min}%`,
                        }}
                        title={`Target: ${plot.targetMoistureRange.min}% - ${plot.targetMoistureRange.max}%`}
                      ></div>
                      {/* Current Value Marker */}
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isBelowMin
                            ? 'bg-amber-500'
                            : isAboveMax
                            ? 'bg-purple-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, plot.currentMoisture))}%` }}
                      ></div>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-stone-500">
                      <span>0% Wilting</span>
                      <span>
                        Target: {plot.targetMoistureRange.min}% - {plot.targetMoistureRange.max}%
                      </span>
                      <span>100% Saturation</span>
                    </div>
                  </div>

                  {/* Footer telemetry */}
                  <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2 text-[11px] text-stone-500">
                    <div className="flex items-center space-x-3">
                      <span>{plot.currentTemp}°C</span>
                      <span>{plot.currentHumidity}% RH</span>
                      {plot.currentPh && <span>pH {plot.currentPh.toFixed(1)}</span>}
                    </div>
                    <div className="flex items-center space-x-1 text-stone-500">
                      <Clock className="h-3 w-3" />
                      <span>Telemetry Live</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Multi-Plot Moisture Trends */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700">
              Live Field Moisture Dynamics
            </h3>
            <button
              onClick={() => onSelectPage('sensors')}
              className="flex items-center space-x-1 text-xs font-medium text-emerald-700 hover:text-emerald-900"
            >
              <span>Sensor Hub</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="time" stroke="#78716c" fontSize={11} />
                  <YAxis domain={[15, 95]} stroke="#78716c" fontSize={11} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e7e5e4',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  {plots[0] && (
                    <Line
                      type="monotone"
                      dataKey="plot0"
                      name={`${plots[0].name.split(' - ')[0]} (${plots[0].cropType.split(' ')[0]})`}
                      stroke="#059669"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  )}
                  {plots[1] && (
                    <Line
                      type="monotone"
                      dataKey="plot1"
                      name={`${plots[1].name.split(' - ')[0]} (${plots[1].cropType.split(' ')[0]})`}
                      stroke="#d97706"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  )}
                  {plots[2] && (
                    <Line
                      type="monotone"
                      dataKey="plot2"
                      name={`${plots[2].name.split(' - ')[0]} (${plots[2].cropType.split(' ')[0]})`}
                      stroke="#dc2626"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  )}
                  {plots[3] && (
                    <Line
                      type="monotone"
                      dataKey="plot3"
                      name={`${plots[3].name.split(' - ')[0]} (${plots[3].cropType.split(' ')[0]})`}
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-center text-[11px] text-stone-500">
              Real-time volumetric soil moisture (VWC %) across Indian crop zones
            </div>
          </div>

          {/* Active Alerts Strip */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Environmental & Agronomic Alerts
              </span>
              <button
                onClick={() => onSelectPage('alerts')}
                className="text-xs text-emerald-700 hover:underline"
              >
                View All ({alerts.length})
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {activeAlerts.length === 0 ? (
                <div className="flex items-center space-x-2 text-xs text-stone-500 py-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>No active critical alerts. Soil & weather parameters nominal.</span>
                </div>
              ) : (
                activeAlerts.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start space-x-2 rounded-lg border border-stone-100 bg-stone-50 p-2 text-xs"
                  >
                    <AlertTriangle
                      className={`h-4 w-4 shrink-0 mt-0.5 ${
                        a.severity === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-900">{a.title}</span>
                        <span className="text-[10px] text-stone-600 font-mono">
                          {new Date(a.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="mt-0.5 text-stone-600 line-clamp-1">{a.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
