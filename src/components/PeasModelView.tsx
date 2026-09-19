import React from 'react';
import {
  BookOpen,
  Trophy,
  Globe,
  Zap,
  Radio,
  CheckCircle2,
  HelpCircle,
  Cpu,
} from 'lucide-react';

export const PeasModelView: React.FC = () => {
  return (
    <div id="peas-model-view" className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-emerald-800" />
          <h2 className="text-lg font-bold text-stone-900">
            Formal PEAS Model & Agent Classification
          </h2>
        </div>
        <p className="mt-1 text-xs text-stone-500 leading-relaxed">
          The AgroGenesis system is formally modeled using Russell & Norvig's Artificial Intelligence agent paradigm: Performance, Environment, Actuators, and Sensors (PEAS).
        </p>
      </div>

      {/* Agent Classification Card */}
      <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-5 shadow-xs">
        <div className="flex items-center space-x-2 text-emerald-950 font-bold text-sm">
          <Cpu className="h-5 w-5 text-emerald-800" />
          <span>Agent Architectural Classification: Model-Based Utility Agent</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs text-emerald-900">
          <div className="rounded-lg bg-white/80 p-3 border border-emerald-200">
            <strong className="block text-emerald-950">1. Model-Based:</strong>
            Maintains an internal world representation of multi-plot soil moisture, root zone depths, and hydraulic drainage characteristics across time cycles.
          </div>
          <div className="rounded-lg bg-white/80 p-3 border border-emerald-200">
            <strong className="block text-emerald-950">2. Utility-Based:</strong>
            Balances conflicting trade-offs (e.g., immediate water deficit vs. upcoming rain forecast energy cost) to maximize net resource efficiency.
          </div>
          <div className="rounded-lg bg-white/80 p-3 border border-emerald-200">
            <strong className="block text-emerald-950">3. Safety-Bounded:</strong>
            Deterministic guardrails prevent pump over-saturation, lock out corrupted telemetry, and mandate operator authorization.
          </div>
        </div>
      </div>

      {/* PEAS Matrix Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Performance Measure (P) */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <div className="rounded-lg bg-amber-100 p-1.5 text-amber-800">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Performance Measures (P)</h3>
              <p className="text-[11px] text-stone-500">How the agent's success is evaluated</p>
            </div>
          </div>

          <ul className="mt-4 space-y-2.5 text-xs text-stone-700">
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <strong>Water Conservation Efficiency:</strong> Liters of freshwater saved compared to a fixed static timer schedule.
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <strong>Crop Stress Avoidance:</strong> Percentage of total growing time maintained within optimal volumetric moisture bounds.
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <strong>Nutrient Efficiency:</strong> Avoidance of excessive nitrogen runoff and groundwater leaching.
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <strong>Actuation Safety Invariant:</strong> Zero unauthorized, out-of-bounds, or dry-pump actuations.
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <strong>Operator Trust & Transparency:</strong> Grounded agronomic explanations provided for 100% of recommendations.
              </div>
            </li>
          </ul>
        </div>

        {/* Environment (E) */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <div className="rounded-lg bg-blue-100 p-1.5 text-blue-800">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Environment (E)</h3>
              <p className="text-[11px] text-stone-500">The domain with which the agent interacts</p>
            </div>
          </div>

          <ul className="mt-4 space-y-2.5 text-xs text-stone-700">
            <li className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5"></span>
              <div>
                <strong>Soil Hydraulics:</strong> Dynamic moisture diffusion, field capacity, wilting point, and variable drainage rates (Clay, Loam, Sandy).
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5"></span>
              <div>
                <strong>Meteorological Microclimate:</strong> Ambient temperature, relative humidity, wind, past rainfall, and probabilistic forecast rain.
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5"></span>
              <div>
                <strong>Crop Phenology:</strong> Crop growth stages (Germination, Vegetative, Flowering, Maturation) and seasonal crop coefficients (Kc).
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5"></span>
              <div>
                <strong>Partially Observable Dynamics:</strong> Subsurface water percolation and unmeasured nutrient mineralization.
              </div>
            </li>
          </ul>
        </div>

        {/* Actuators (A) */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <div className="rounded-lg bg-rose-100 p-1.5 text-rose-800">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Actuators (A)</h3>
              <p className="text-[11px] text-stone-500">Mechanisms used by the agent to affect change</p>
            </div>
          </div>

          <ul className="mt-4 space-y-2.5 text-xs text-stone-700">
            <li className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0 mt-1.5"></span>
              <div>
                <strong>Simulated Irrigation Solenoids:</strong> Timed pulse delivery commands (minutes, liters) to plot drip/sprinkler lines.
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0 mt-1.5"></span>
              <div>
                <strong>Fertilizer Dosing Recommender:</strong> Structured agronomic application protocols and lab test orders.
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0 mt-1.5"></span>
              <div>
                <strong>Notification Dispatch:</strong> Real-time alerts for sensor anomalies, high thermal stress, and over-moisture.
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0 mt-1.5"></span>
              <div>
                <strong>Operator Approval Gate:</strong> Human-in-the-loop confirmation modal before executing physical actions.
              </div>
            </li>
          </ul>
        </div>

        {/* Sensors (S) */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <div className="rounded-lg bg-emerald-100 p-1.5 text-emerald-800">
              <Radio className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Sensors (S)</h3>
              <p className="text-[11px] text-stone-500">Perceptual inputs gathered from the environment</p>
            </div>
          </div>

          <ul className="mt-4 space-y-2.5 text-xs text-stone-700">
            <li className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5"></span>
              <div>
                <strong>Capacitive FMCW Soil Probes:</strong> Measuring volumetric moisture percentage (% VWC).
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5"></span>
              <div>
                <strong>Thermal & Humidity Transducers:</strong> Soil temperature (°C) and ambient air relative humidity (RH).
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5"></span>
              <div>
                <strong>Optical / Spectrophotometric Foliage Camera:</strong> Capturing leaf images for Gemini computer vision.
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5"></span>
              <div>
                <strong>Electrochemical Ion Probes:</strong> Soil pH and calibrated NPK macronutrient concentrations.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
