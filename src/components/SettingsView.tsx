import React, { useState } from 'react';
import {
  Settings,
  MapPin,
  Globe,
  Sparkles,
  ShieldCheck,
  Cpu,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Radio,
  Sliders,
  Sun,
  Moon,
} from 'lucide-react';
import { AgentSystemStatus, Farm, CroppingSeason, SupportedLanguage, UnitSystem } from '../types';
import { useTranslation } from '../locales/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { INDIAN_STATES_AND_DISTRICTS, CROPPING_SEASONS } from '../data/indianAgriData';
import { api } from '../services/api';

interface SettingsViewProps {
  systemStatus: AgentSystemStatus;
  farm?: Farm;
  onResetDemo: () => void;
  onFarmUpdated?: (farm: Farm) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  systemStatus,
  farm,
  onResetDemo,
  onFarmUpdated,
}) => {
  const { language, setLanguage, unitSystem, setUnitSystem, t } = useTranslation();
  const { theme, setTheme } = useTheme();

  // Location form state
  const [selectedState, setSelectedState] = useState<string>(farm?.state || 'Maharashtra');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(farm?.district || 'Thane');
  const [taluka, setTaluka] = useState<string>(farm?.talukaOrVillage || 'Shahapur');
  const [season, setSeason] = useState<CroppingSeason>(farm?.season || 'Kharif');
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [locationSaveSuccess, setLocationSaveSuccess] = useState(false);

  // IoT tabs
  const [activeCodeTab, setActiveCodeTab] = useState<'rest' | 'mqtt' | 'modbus'>('rest');

  const states = Object.keys(INDIAN_STATES_AND_DISTRICTS);
  const districts = INDIAN_STATES_AND_DISTRICTS[selectedState] || [];

  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    const newDistricts = INDIAN_STATES_AND_DISTRICTS[newState] || [];
    setSelectedDistrict(newDistricts[0] || '');
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLocation(true);
    setLocationSaveSuccess(false);
    try {
      const res = await api.updateFarmLocation({
        state: selectedState,
        district: selectedDistrict,
        talukaOrVillage: taluka,
        season,
      });
      if (res.success && res.farm) {
        setLocationSaveSuccess(true);
        if (onFarmUpdated) {
          onFarmUpdated(res.farm);
        }
        setTimeout(() => setLocationSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to update farm location:', err);
    } finally {
      setIsSavingLocation(false);
    }
  };

  const restExample = `// ESP32 Arduino C++ HTTP POST Telemetry Client for Indian Agri Nodes
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* serverUrl = "http://agro-gateway.local:3000/api/sensors/inject";

void sendMoistureReading(float moisturePct, float soilTempC) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<256> doc;
    doc["plotId"] = "plot-1";
    doc["sensorType"] = "soil_moisture";
    doc["value"] = moisturePct;
    doc["unit"] = "%";
    doc["qualityStatus"] = "valid";

    String requestBody;
    serializeJson(doc, requestBody);
    int httpResponseCode = http.POST(requestBody);
    http.end();
  }
}`;

  const mqttExample = `// MQTT Telemetry Topic Schema
// Topic: agro/farms/india-${selectedState.toLowerCase()}/plots/plot-1/telemetry
{
  "timestamp": "${new Date().toISOString()}",
  "nodeId": "ESP32-LORA-NODE-MH04",
  "state": "${selectedState}",
  "district": "${selectedDistrict}",
  "batteryVoltage": 3.84,
  "telemetry": {
    "soilMoistureVWC": 48.5,
    "soilTempC": 28.2,
    "ambientHumidity": 68.0,
    "soilPh": 6.8
  },
  "signature": "SHA256_HMAC_HARDWARE_KEY"
}`;

  const modbusExample = `// RS-485 Modbus RTU Register Mapping (Indian Field Solar/AC Pump Controllers)
// Baud: 9600, 8-N-1, Slave Address: 0x01
Holding Register 0x0001: Soil Moisture (0.1% resolution, e.g. 485 = 48.5%)
Holding Register 0x0002: Soil Temperature (0.1°C resolution, e.g. 282 = 28.2°C)
Holding Register 0x0003: Electrical Conductivity EC (uS/cm)
Holding Register 0x0004: Soil pH (0.01 resolution, e.g. 680 = 6.80 pH)
Coil 0x0001: Solenoid Valve / Drip Starter Relay (0=OFF, 1=ON [Max 45min safety timer])`;

  return (
    <div id="settings-view" className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-emerald-800" />
          <h2 className="text-lg font-bold text-stone-900">
            {t.settingsTitle || 'AgroGenesis Farm Configuration & Hardware System Settings'}
          </h2>
        </div>
        <p className="mt-1 text-xs text-stone-500 leading-relaxed">
          Configure Indian regional farm parameters, state and district agro-climatic boundaries, multilingual preferences, and IoT telemetry interface protocols.
        </p>
      </div>

      {/* Regional Farm Location & Season Configuration Form */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-emerald-700" />
            <h3 className="font-bold text-stone-900 text-sm">
              Indian Regional Location & Agro-Climatic Zone
            </h3>
          </div>
          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
            ICAR Regional Grounding
          </span>
        </div>

        <form onSubmit={handleSaveLocation} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* State */}
            <div>
              <label className="block font-medium text-stone-700">Indian State (राज्य)</label>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900 shadow-2xs focus:border-emerald-700 focus:outline-hidden"
              >
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block font-medium text-stone-700">District (जिल्हा / जिला)</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900 shadow-2xs focus:border-emerald-700 focus:outline-hidden"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Taluka / Village */}
            <div>
              <label className="block font-medium text-stone-700">Taluka / Village (तालुका / गाव)</label>
              <input
                type="text"
                value={taluka}
                onChange={(e) => setTaluka(e.target.value)}
                placeholder="e.g. Shahapur / Baramati"
                className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900 shadow-2xs focus:border-emerald-700 focus:outline-hidden"
              />
            </div>

            {/* Season */}
            <div>
              <label className="block font-medium text-stone-700">Cropping Season (हंगाम)</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as CroppingSeason)}
                className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900 shadow-2xs focus:border-emerald-700 focus:outline-hidden"
              >
                {CROPPING_SEASONS.map((s: CroppingSeason) => (
                  <option key={s} value={s}>
                    {s} Season ({s === 'Kharif' ? 'खरीप (June-Oct)' : s === 'Rabi' ? 'रब्बी (Oct-March)' : 'उन्हाळी / Zaid (March-June)'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-stone-100 pt-3">
            <div className="text-[11px] text-stone-500">
              Active Location: <strong className="text-stone-700">{selectedDistrict}, {selectedState} ({season})</strong>
            </div>

            <div className="flex items-center space-x-3">
              {locationSaveSuccess && (
                <span className="flex items-center space-x-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Farm Location Synchronized!</span>
                </span>
              )}
              <button
                type="submit"
                disabled={isSavingLocation}
                className="rounded-lg bg-emerald-800 px-4 py-2 font-medium text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {isSavingLocation ? 'Updating...' : 'Save Farm Location'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Language, Measurement & Theme Appearance Preferences */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <Globe className="h-4 w-4 text-emerald-700" />
            <h3 className="font-bold text-stone-900 text-sm">Language Preference (भाषा निवडा)</h3>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Select your preferred display and AI conversation language:
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { id: 'en', label: 'English', sub: 'Default' },
              { id: 'hi', label: 'हिन्दी', sub: 'Hindi' },
              { id: 'mr', label: 'मराठी', sub: 'Marathi' },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLanguage(lang.id as SupportedLanguage)}
                className={`rounded-lg border p-2.5 text-center transition-all ${
                  language === lang.id
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-semibold shadow-2xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="text-xs font-bold">{lang.label}</div>
                <div className="text-[10px] text-stone-500">{lang.sub}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <Sliders className="h-4 w-4 text-emerald-700" />
            <h3 className="font-bold text-stone-900 text-sm">Measurement Units (क्षेत्रफळ एकक)</h3>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Indian farmers typically measure plots in Acres (एकड). You can toggle between Acres and Hectares:
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { id: 'acre', label: 'Acre (एकड)', desc: '1 Hectare = 2.471 Acres' },
              { id: 'hectare', label: 'Hectare (हेक्टर)', desc: 'Metric standard (ha)' },
            ].map((unit) => (
              <button
                key={unit.id}
                type="button"
                onClick={() => setUnitSystem(unit.id as UnitSystem)}
                className={`rounded-lg border p-2.5 text-center transition-all ${
                  unitSystem === unit.id
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-semibold shadow-2xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="text-xs font-bold">{unit.label}</div>
                <div className="text-[10px] text-stone-500">{unit.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            {theme === 'dark' ? (
              <Moon className="h-4 w-4 text-amber-500" />
            ) : (
              <Sun className="h-4 w-4 text-amber-600" />
            )}
            <h3 className="font-bold text-stone-900 text-sm">Theme & Appearance (थीम स्वरूप)</h3>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Toggle between daytime sun legibility and dark contrast for night field checks:
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`rounded-lg border p-2.5 text-center transition-all ${
                theme === 'light'
                  ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-semibold shadow-2xs'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-1.5">
                <Sun className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs font-bold">Light Mode</span>
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">Daytime Sunlight</div>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`rounded-lg border p-2.5 text-center transition-all ${
                theme === 'dark'
                  ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-semibold shadow-2xs'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-1.5">
                <Moon className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-bold">Dark Mode</span>
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">Night Monitoring</div>
            </button>
          </div>
        </div>
      </div>

      {/* Hardware Adapter Protocols */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-bold text-stone-900 text-sm">
              Physical Microcontroller Interfacing (ESP32 / LoRa / Modbus)
            </h3>
            <p className="text-xs text-stone-500">
              Field telemetry ingest schemas for commercial Indian farm deployments
            </p>
          </div>

          {/* Protocol Tabs */}
          <div className="flex space-x-1 rounded-lg border border-stone-200 bg-stone-50 p-1 text-xs">
            <button
              onClick={() => setActiveCodeTab('rest')}
              className={`rounded px-3 py-1 font-medium ${
                activeCodeTab === 'rest'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              REST HTTP POST
            </button>
            <button
              onClick={() => setActiveCodeTab('mqtt')}
              className={`rounded px-3 py-1 font-medium ${
                activeCodeTab === 'mqtt'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              MQTT Broker
            </button>
            <button
              onClick={() => setActiveCodeTab('modbus')}
              className={`rounded px-3 py-1 font-medium ${
                activeCodeTab === 'modbus'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              RS-485 Modbus RTU
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-stone-900 p-4 text-stone-100 font-mono text-xs overflow-x-auto">
          <pre>
            {activeCodeTab === 'rest'
              ? restExample
              : activeCodeTab === 'mqtt'
              ? mqttExample
              : modbusExample}
          </pre>
        </div>
      </div>

      {/* Reset Demonstration Data */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Reset Farm Environment Baseline</h3>
            <p className="text-xs text-stone-500">
              Reload nominal Indian crop parameters, flush transient alerts, and restore 4 default demonstration zones.
            </p>
          </div>
          <button
            onClick={onResetDemo}
            className="flex items-center space-x-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50"
          >
            <RotateCcw className="h-3.5 w-3.5 text-stone-500" />
            <span>Reset Demo Baseline</span>
          </button>
        </div>
      </div>
    </div>
  );
};
