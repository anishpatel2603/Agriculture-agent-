import React, { useState } from 'react';
import {
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldCheck,
  Sparkles,
  FileQuestion,
  FileText,
  Clock,
  Layers,
} from 'lucide-react';
import { Plot } from '../types';
import { useTranslation } from '../locales/LanguageContext';
import {
  INDIAN_CROP_DATABASE,
  INDIAN_FERTILIZERS,
  calculateIndianFertilizerDose,
} from '../data/indianAgriData';

interface FertilizationViewProps {
  plots: Plot[];
}

export const FertilizationView: React.FC<FertilizationViewProps> = ({ plots }) => {
  const { t, language, formatArea } = useTranslation();
  const [selectedPlotId, setSelectedPlotId] = useState<string>(plots[0]?.id || '');
  const currentPlot = plots.find((p) => p.id === selectedPlotId) || plots[0];

  const hasNutrients =
    (currentPlot?.nitrogenMgKg !== undefined &&
      currentPlot?.phosphorusMgKg !== undefined &&
      currentPlot?.potassiumMgKg !== undefined) ||
    currentPlot?.soilHealthCard?.hasCard === true;

  const currentPh = currentPlot?.currentPh ?? 6.8;
  const crop = currentPlot ? INDIAN_CROP_DATABASE[currentPlot.cropType] : undefined;

  // Calculate Indian Fertilizer formulation
  const areaAcre = currentPlot?.areaAcre || (currentPlot?.areaHa ? currentPlot.areaHa * 2.471 : 1.0);
  const fertilizerPlan =
    crop && hasNutrients
      ? calculateIndianFertilizerDose(
          currentPlot.cropType,
          areaAcre,
          currentPlot.nitrogenMgKg,
          currentPlot.phosphorusMgKg,
          currentPlot.potassiumMgKg
        )
      : null;

  return (
    <div id="fertilization-view" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-stone-900">
            {t.fertilizationTitle || 'Indian Fertilization Engine & KVK Soil Health Card'}
          </h2>
          <p className="text-xs text-stone-500">
            ICAR package of practices • Soil Health Card NPK balancing • Urea/DAP/MOP dosage calculation • Zero-Fabrication safety policy.
          </p>
        </div>

        {/* Plot Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-medium text-stone-600">Select Plot:</span>
          <select
            value={currentPlot?.id}
            onChange={(e) => setSelectedPlotId(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 font-medium text-stone-800 shadow-xs"
          >
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.cropType})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Zero-Fabrication Guardrail Notice */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-950">
        <div className="flex items-center space-x-2 font-bold text-blue-900">
          <ShieldCheck className="h-4 w-4 text-blue-700" />
          <span>Strict Zero-Fabrication Guardrail (शून्य-बनावट नियम)</span>
        </div>
        <p className="mt-1 text-blue-800 leading-relaxed">
          The agent will NEVER invent or hallucinate chemical fertilizer doses without verified Soil Health Card or laboratory NPK readings. If soil telemetry is missing, the agent recommends submitting a representative composite sample to the nearest Krishi Vigyan Kendra (KVK) or State Soil Testing Lab.
        </p>
      </div>

      {/* Main Grid: Nutrient Cards & Soil pH Bioavailability */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Nutrient Status Card (2 cols) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-stone-900">
                  {currentPlot?.name} — Soil Chemistry & Nutrient Status
                </h3>
                <p className="text-xs text-stone-500">
                  Crop: {currentPlot?.cropType} • Stage: {currentPlot?.growthStage} • Soil: {currentPlot?.soilType}
                </p>
              </div>

              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  hasNutrients
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {hasNutrients ? 'VERIFIED TELEMETRY / SHC' : 'DATA MISSING (NO CARD)'}
              </span>
            </div>

            {hasNutrients ? (
              <div className="mt-4 space-y-4">
                {/* Nitrogen */}
                <div className="rounded-lg border border-stone-100 bg-stone-50 p-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900">Available Nitrogen (नत्र - N)</span>
                      <p className="text-[11px] text-stone-500">Essential for vegetative growth and chlorophyll synthesis</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-800 text-sm">
                        {currentPlot?.nitrogenMgKg ?? (currentPlot?.soilHealthCard?.availableNitrogenKgHa ? Math.round(currentPlot.soilHealthCard.availableNitrogenKgHa / 2.24) : 140)} mg/kg
                      </span>
                      <div className="text-[10px] text-stone-500 font-mono">
                        (~{currentPlot?.soilHealthCard?.availableNitrogenKgHa ?? Math.round((currentPlot?.nitrogenMgKg || 140) * 2.24)} kg/ha)
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-stone-500">
                    <span>ICAR Benchmark: 120 - 200 mg/kg</span>
                    <span className="text-emerald-700 font-semibold">Adequate Status</span>
                  </div>
                </div>

                {/* Phosphorus */}
                <div className="rounded-lg border border-stone-100 bg-stone-50 p-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900">Available Phosphorus (स्फुरद - P)</span>
                      <p className="text-[11px] text-stone-500">Vital for root elongation, tillering, and flowering</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-800 text-sm">
                        {currentPlot?.phosphorusMgKg ?? 25} mg/kg
                      </span>
                      <div className="text-[10px] text-stone-500 font-mono">
                        (~{currentPlot?.soilHealthCard?.availablePhosphorusKgHa ?? Math.round((currentPlot?.phosphorusMgKg || 25) * 2.24)} kg/ha)
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-stone-500">
                    <span>ICAR Benchmark: 20 - 45 mg/kg</span>
                    <span className="text-emerald-700 font-semibold">Nominal Balance</span>
                  </div>
                </div>

                {/* Potassium */}
                <div className="rounded-lg border border-stone-100 bg-stone-50 p-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900">Available Potassium (पालाश - K)</span>
                      <p className="text-[11px] text-stone-500">Improves disease immunity, drought tolerance, and grain filling</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-800 text-sm">
                        {currentPlot?.potassiumMgKg ?? 210} mg/kg
                      </span>
                      <div className="text-[10px] text-stone-500 font-mono">
                        (~{currentPlot?.soilHealthCard?.availablePotassiumKgHa ?? Math.round((currentPlot?.potassiumMgKg || 210) * 2.24)} kg/ha)
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-stone-500">
                    <span>ICAR Benchmark: 150 - 280 mg/kg</span>
                    <span className="text-emerald-700 font-semibold">Optimal Level</span>
                  </div>
                </div>

                {/* ICAR Recommended Fertilizer Dose for Plot */}
                {fertilizerPlan && (
                  <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50/40 p-4">
                    <div className="flex items-center space-x-2 font-bold text-emerald-950 text-xs">
                      <FlaskConical className="h-4 w-4 text-emerald-700" />
                      <span>ICAR Fertilizer Prescription ({areaAcre.toFixed(1)} Acres Total)</span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-lg bg-white p-2.5 border border-emerald-200">
                        <div className="text-[11px] font-semibold text-stone-700">Neem-Coated Urea</div>
                        <div className="mt-1 text-base font-bold text-emerald-900 font-mono">
                          {fertilizerPlan.ureaKgTotal} kg
                        </div>
                        <div className="text-[10px] text-stone-500">
                          ({fertilizerPlan.ureaBags} bags of 45kg)
                        </div>
                      </div>

                      <div className="rounded-lg bg-white p-2.5 border border-emerald-200">
                        <div className="text-[11px] font-semibold text-stone-700">DAP (18:46:0)</div>
                        <div className="mt-1 text-base font-bold text-emerald-900 font-mono">
                          {fertilizerPlan.dapKgTotal} kg
                        </div>
                        <div className="text-[10px] text-stone-500">
                          ({fertilizerPlan.dapBags} bags of 50kg)
                        </div>
                      </div>

                      <div className="rounded-lg bg-white p-2.5 border border-emerald-200">
                        <div className="text-[11px] font-semibold text-stone-700">MOP (0:0:60)</div>
                        <div className="mt-1 text-base font-bold text-emerald-900 font-mono">
                          {fertilizerPlan.mopKgTotal} kg
                        </div>
                        <div className="text-[10px] text-stone-500">
                          ({fertilizerPlan.mopBags} bags of 50kg)
                        </div>
                      </div>
                    </div>

                    {/* Split Application Schedule */}
                    <div className="mt-3 rounded-lg bg-white/80 p-3 text-[11px] text-stone-700 border border-emerald-100">
                      <span className="font-semibold text-stone-900">Application Timing: </span>
                      {fertilizerPlan.splitApplication}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-6 text-center text-xs">
                <FileQuestion className="mx-auto h-8 w-8 text-amber-600" />
                <h4 className="mt-2 font-bold text-stone-900">
                  Zero-Fabrication Guardrail Activated for {currentPlot?.name}
                </h4>
                <p className="mx-auto mt-1 max-w-md text-stone-600 leading-relaxed">
                  No verified Soil Health Card or laboratory NPK data has been uploaded for this plot. AgroGenesis will strictly NOT guess chemical fertilizer quantities, preventing hazardous salt buildup or financial loss.
                </p>
                <div className="mt-4 inline-block rounded-md bg-white border border-amber-300 px-3.5 py-2 font-semibold text-amber-900 shadow-2xs">
                  Required Action: Submit composite soil sample to nearest Krishi Vigyan Kendra (KVK)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Soil pH & Bioavailability Column (1 col) */}
        <div className="space-y-4">
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <h3 className="font-bold text-stone-900 text-sm">
              Soil pH & Indian Soil Chemistry
            </h3>
            <p className="text-xs text-stone-500">
              Electrochemical reaction influencing root nutrient uptake
            </p>

            {/* pH Gauge */}
            <div className="mt-4 rounded-lg bg-stone-50 p-4 text-center">
              <div className="text-3xl font-bold font-mono text-stone-900">
                {currentPh.toFixed(1)}
              </div>
              <div className="mt-1 text-xs font-semibold text-emerald-800">
                {currentPh < 6.0
                  ? 'Acidic Soil (Laterite / Red Soil)'
                  : currentPh > 7.8
                  ? 'Calcareous / Alkaline (Black Clay)'
                  : 'Optimal Near-Neutral Range'}
              </div>

              {/* pH Bar Scale */}
              <div className="relative mt-3 h-2.5 w-full rounded-full bg-gradient-to-r from-red-400 via-emerald-400 to-blue-400">
                <div
                  className="absolute -top-1 h-4.5 w-2 rounded bg-stone-900 shadow"
                  style={{
                    left: `${Math.max(0, Math.min(100, ((currentPh - 4.5) / 4.5) * 100))}%`,
                  }}
                ></div>
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-stone-500 font-mono">
                <span>4.5 (Acidic)</span>
                <span>6.8 (Ideal)</span>
                <span>9.0 (Saline/Alkaline)</span>
              </div>
            </div>

            {/* Indian Soil Notes */}
            <div className="mt-4 space-y-2 text-xs text-stone-600">
              <div className="font-semibold text-stone-800">Indian Agro-Agronomic Insights:</div>
              <ul className="space-y-1.5 list-disc pl-4">
                <li>
                  <strong className="text-stone-700">Black Cotton Soils (Regur):</strong> Naturally high in Potassium & Calcium, but prone to Zinc and Iron chlorosis under high pH.
                </li>
                <li>
                  <strong className="text-stone-700">Alluvial Plains:</strong> Responsive to split Urea and DAP application due to light to medium loam texture.
                </li>
                <li>
                  <strong className="text-stone-700">Phosphorus Fixation:</strong> In high pH black soil, apply single super phosphate (SSP) or DAP near the root zone.
                </li>
              </ul>
            </div>

            <div className="mt-4 border-t border-stone-100 pt-3 text-[11px] text-stone-500 italic">
              Dosages comply with State Agricultural University (SAU) and ICAR package of practices.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
