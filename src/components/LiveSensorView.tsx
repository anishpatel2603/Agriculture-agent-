import React, { useState, useEffect } from 'react';
import {
  Activity,
  Droplets,
  Thermometer,
  CloudRain,
  FlaskConical,
  Radio,
  SlidersHorizontal,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Send,
} from 'lucide-react';
import { Plot, SensorReading, SensorType, QualityStatus } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api } from '../services/api';

interface LiveSensorViewProps {
  plots: Plot[];
  selectedPlotId: string;
  onSelectPlot: (plotId: string) => void;
}

export const LiveSensorView: React.FC<LiveSensorViewProps> = ({
  plots,
  selectedPlotId,
  onSelectPlot,
}) => {
  const currentPlot = plots.find((p) => p.id === selectedPlotId) || plots[0];
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [activeMetric, setActiveMetric] = useState<SensorType>('soil_moisture');

  // Manual injection form state
  const [injectValue, setInjectValue] = useState<number>(35);
  const [injectQuality, setInjectQuality] = useState<QualityStatus>('valid');
  const [injectSuccessMsg, setInjectSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 4000);
    return () => clearInterval(interval);
  }, [currentPlot?.id, activeMetric]);

  const loadHistory = async () => {
    if (!currentPlot) return;
    try {
      const data = await api.getSensorHistory(currentPlot.id, activeMetric);
      setHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlot) return;
    try {
      await api.injectSensorReading({
        plotId: currentPlot.id,
        sensorType: activeMetric,
        value: Number(injectValue),
        unit: activeMetric === 'soil_moisture' ? '%' : activeMetric === 'soil_temperature' ? '°C' : 'pH',
        qualityStatus: injectQuality,
      });
      setInjectSuccessMsg(`Successfully injected ${injectValue} (${injectQuality}) into ${currentPlot.name}`);
      setTimeout(() => setInjectSuccessMsg(null), 3500);
      loadHistory();
    } catch (e) {
      console.error(e);
    }
  };

  const chartData = history.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    value: item.value,
    quality: item.qualityStatus,
  }));

  const targetMin = currentPlot?.targetMoistureRange.min ?? 50;
  const targetMax = currentPlot?.targetMoistureRange.max ?? 80;

  return (
    <div id="live-sensor-view" className="space-y-6">
      {/* Top Header & Selector */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Live Sensor Ingestion & Telemetry Hub</h2>
          <p className="text-xs text-stone-500">
            Real-time multi-spectral sensor monitoring, data quality validation, and manual override testing.
          </p>
        </div>

        {/* Plot Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-medium text-stone-600">Select Zone:</span>
          <select
            value={currentPlot?.id}
            onChange={(e) => onSelectPlot(e.target.value)}
            className="rounded-lg border border-stone-300 bg-stone-50 px-3 py-1.5 font-medium text-stone-800"
          >
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.cropType})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Tabs */}
      <div className="flex space-x-2 border-b border-stone-200 pb-2 text-xs">
        {[
          { id: 'soil_moisture', label: 'Soil Moisture (%)', icon: Droplets },
          { id: 'soil_temperature', label: 'Temperature (°C)', icon: Thermometer },
          { id: 'humidity', label: 'Humidity (%)', icon: CloudRain },
          { id: 'soil_ph', label: 'Soil pH', icon: FlaskConical },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMetric === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMetric(tab.id as SensorType)}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Large Chart (2 cols) */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-bold text-stone-900 capitalize">
                {activeMetric.replace('_', ' ')} Telemetry Stream
              </h3>
              <p className="text-xs text-stone-500">
                Plot: {currentPlot?.name} • Last synchronized: {currentPlot?.lastReadingTime ? new Date(currentPlot.lastReadingTime).toLocaleTimeString() : 'Now'}
              </p>
            </div>

            {activeMetric === 'soil_moisture' && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="inline-block h-3 w-3 rounded bg-emerald-100 border border-emerald-300"></span>
                <span className="text-stone-600">
                  Target Envelope: {targetMin}% - {targetMax}%
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis dataKey="time" stroke="#a8a29e" fontSize={10} />
                <YAxis
                  stroke="#a8a29e"
                  fontSize={10}
                  domain={activeMetric === 'soil_moisture' ? [10, 95] : activeMetric === 'soil_ph' ? [4, 9] : [10, 45]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e7e5e4',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />

                {activeMetric === 'soil_moisture' && (
                  <>
                    <ReferenceArea
                      y1={targetMin}
                      y2={targetMax}
                      fill="#10b981"
                      fillOpacity={0.12}
                    />
                    <ReferenceLine
                      y={targetMin}
                      stroke="#059669"
                      strokeDasharray="4 4"
                      label={{ value: `Min ${targetMin}%`, fill: '#059669', fontSize: 10 }}
                    />
                    <ReferenceLine
                      y={targetMax}
                      stroke="#059669"
                      strokeDasharray="4 4"
                      label={{ value: `Max ${targetMax}%`, fill: '#059669', fontSize: 10 }}
                    />
                  </>
                )}

                <Line
                  type="monotone"
                  dataKey="value"
                  name={activeMetric}
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#059669' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center text-[11px] text-stone-500">
            Telemetry ingested continuously by the AgroGenesis Data Validation Layer
          </div>
        </div>

        {/* Manual Telemetry Override & Ingestion Panel (1 col) */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="h-4 w-4 text-emerald-700" />
            <h3 className="font-bold text-stone-900">Lab Telemetry Injector</h3>
          </div>
          <p className="mt-1 text-xs text-stone-500 leading-relaxed">
            Use this interactive panel to simulate physical hardware readings, extreme drought, floods, or wire anomalies.
          </p>

          {injectSuccessMsg && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
              {injectSuccessMsg}
            </div>
          )}

          <form onSubmit={handleInject} className="mt-4 space-y-3 text-xs">
            <div>
              <label className="block font-medium text-stone-700">Target Plot</label>
              <input
                type="text"
                disabled
                value={currentPlot?.name}
                className="mt-1 w-full rounded border border-stone-200 bg-stone-100 p-2 text-stone-600 font-medium"
              />
            </div>

            <div>
              <label className="block font-medium text-stone-700">Sensor Metric</label>
              <select
                value={activeMetric}
                onChange={(e) => setActiveMetric(e.target.value as SensorType)}
                className="mt-1 w-full rounded border border-stone-300 p-2 text-stone-800"
              >
                <option value="soil_moisture">Soil Moisture (%)</option>
                <option value="soil_temperature">Soil Temperature (°C)</option>
                <option value="humidity">Relative Humidity (%)</option>
                <option value="soil_ph">Soil pH</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-stone-700">Simulated Value</label>
              <input
                type="number"
                step="0.5"
                value={injectValue}
                onChange={(e) => setInjectValue(Number(e.target.value))}
                className="mt-1 w-full rounded border border-stone-300 p-2 text-stone-900 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block font-medium text-stone-700">Telemetry Quality Status</label>
              <select
                value={injectQuality}
                onChange={(e) => setInjectQuality(e.target.value as QualityStatus)}
                className="mt-1 w-full rounded border border-stone-300 p-2 text-stone-800"
              >
                <option value="valid">Valid (Physically sound)</option>
                <option value="stale">Stale (Timestamp expired)</option>
                <option value="anomalous">Anomalous (Sensor disconnected / spike)</option>
                <option value="missing">Missing (Null reading)</option>
              </select>
            </div>

            <button
              type="submit"
              className="mt-3 flex w-full items-center justify-center space-x-1.5 rounded-lg bg-emerald-800 py-2 font-medium text-white shadow-xs hover:bg-emerald-700"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Inject Telemetry Packet</span>
            </button>
          </form>
        </div>
      </div>

      {/* Sensor Nodes Telemetry Table */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700">
          Connected Sensor Node Health Table
        </h3>
        <p className="text-xs text-stone-500">
          Status of active physical/simulated sensing modalities for {currentPlot?.name}
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold uppercase text-stone-500">
              <tr>
                <th className="py-2.5 px-3">Sensor Type</th>
                <th className="py-2.5 px-3">Current Telemetry</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3">Source Channel</th>
                <th className="py-2.5 px-3">Data Quality Status</th>
                <th className="py-2.5 px-3">Sampling Interval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              <tr>
                <td className="py-2.5 px-3 font-medium text-stone-900">Soil Moisture</td>
                <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                  {currentPlot?.currentMoisture.toFixed(1)}%
                </td>
                <td className="py-2.5 px-3">% VWC</td>
                <td className="py-2.5 px-3">Capacitive FMCW / Simulator</td>
                <td className="py-2.5 px-3">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    VALID
                  </span>
                </td>
                <td className="py-2.5 px-3">Every 3.5s</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-stone-900">Soil & Ambient Temp</td>
                <td className="py-2.5 px-3 font-mono text-stone-800">{currentPlot?.currentTemp}°C</td>
                <td className="py-2.5 px-3">Celsius</td>
                <td className="py-2.5 px-3">DS18B20 Digital Probe</td>
                <td className="py-2.5 px-3">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    VALID
                  </span>
                </td>
                <td className="py-2.5 px-3">Every 3.5s</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-stone-900">Relative Humidity</td>
                <td className="py-2.5 px-3 font-mono text-stone-800">
                  {currentPlot?.currentHumidity}%
                </td>
                <td className="py-2.5 px-3">% RH</td>
                <td className="py-2.5 px-3">SHT31 Environmental Sensor</td>
                <td className="py-2.5 px-3">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    VALID
                  </span>
                </td>
                <td className="py-2.5 px-3">Every 3.5s</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-stone-900">Soil pH</td>
                <td className="py-2.5 px-3 font-mono text-stone-800">
                  {currentPlot?.currentPh ? currentPlot.currentPh.toFixed(1) : '6.4'}
                </td>
                <td className="py-2.5 px-3">pH scale</td>
                <td className="py-2.5 px-3">Electrochemical Ion Probe</td>
                <td className="py-2.5 px-3">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    VALID
                  </span>
                </td>
                <td className="py-2.5 px-3">Every 60s</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-stone-900">Macronutrients (N-P-K)</td>
                <td className="py-2.5 px-3 font-mono text-stone-800">
                  {currentPlot?.nitrogenMgKg !== undefined
                    ? `${currentPlot.nitrogenMgKg}-${currentPlot.phosphorusMgKg}-${currentPlot.potassiumMgKg}`
                    : 'Unmeasured'}
                </td>
                <td className="py-2.5 px-3">mg/kg</td>
                <td className="py-2.5 px-3">Optical / Lab Mehlich-3</td>
                <td className="py-2.5 px-3">
                  {currentPlot?.nitrogenMgKg !== undefined ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      VALID
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      MISSING (SAFE)
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3">Periodic</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
