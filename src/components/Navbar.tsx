import React from 'react';
import {
  Zap,
  Bot,
  CloudSun,
  Droplets,
  Languages,
  Compass,
  ZapOff,
  Sun,
  Moon,
} from 'lucide-react';
import { AgentSystemStatus, WeatherData, Farm, Language, UnitSystem } from '../types';
import { useTranslation } from '../locales/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  systemStatus: AgentSystemStatus;
  weather: WeatherData;
  farm?: Farm;
  onToggleSimulation: () => void;
  onChangeSpeed: (speed: number) => void;
  onOpenAssistant: () => void;
  onTriggerCycle: () => void;
  onSelectPage: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  systemStatus,
  weather,
  farm,
  onToggleSimulation,
  onChangeSpeed,
  onOpenAssistant,
  onTriggerCycle,
  onSelectPage,
}) => {
  const { language, setLanguage, t, unitSystem, setUnitSystem } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      id="agro-navbar"
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stone-200 bg-white/95 px-3 backdrop-blur-md sm:px-6"
    >
      {/* Brand & Indian Identity */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onSelectPage('dashboard')}
          className="flex items-center space-x-2.5 text-left focus:outline-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-sm">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif text-lg font-bold tracking-tight text-stone-900">
                AgroGenesis
              </span>
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                🇮🇳 {t.demoBadge}
              </span>
            </div>
            <p className="hidden text-[11px] text-stone-500 sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </button>

        {/* Region & Agro-climatic tag */}
        {farm && (
          <div
            onClick={() => onSelectPage('settings')}
            title="Click to configure Indian farm location & season"
            className="hidden xl:flex cursor-pointer items-center space-x-1.5 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] text-stone-700 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
          >
            <Compass className="h-3 w-3 text-emerald-600" />
            <span className="font-semibold">{farm.state}</span>
            <span className="text-stone-400">({farm.district})</span>
            <span className="rounded bg-emerald-100/70 px-1.5 py-0.2 font-medium text-emerald-800">
              {t.seasons[farm.currentSeason.toLowerCase() as keyof typeof t.seasons] || farm.currentSeason}
            </span>
          </div>
        )}
      </div>

      {/* Center Live Agent & Weather Telemetry */}
      <div className="hidden items-center space-x-3 lg:flex">
        {/* Agent Loop Status Pill */}
        <div className="flex items-center space-x-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs">
          <span className="relative flex h-2 w-2">
            {systemStatus.isSimulating ? (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
              </>
            ) : (
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
            )}
          </span>
          <span className="font-medium text-stone-700">
            {systemStatus.isSimulating ? 'Agent Active' : 'Simulation Paused'}
          </span>
          <span className="text-stone-300">|</span>
          <span className="text-stone-500 font-mono text-[11px]">
            #{systemStatus.currentCycle}
          </span>
          {systemStatus.currentStage !== 'IDLE' && (
            <span className="rounded bg-emerald-100 px-1.5 py-0.2 font-mono text-[10px] font-bold text-emerald-800">
              {systemStatus.currentStage}
            </span>
          )}
        </div>

        {/* Monsoon & Weather Preview */}
        <div className="flex items-center space-x-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-600">
          <CloudSun className="h-3.5 w-3.5 text-amber-600" />
          <span>{weather.temperatureC}°C</span>
          <span className="text-stone-300">|</span>
          <span>{weather.humidityPercent}% RH</span>
          <span className="text-stone-300">|</span>
          <span className="rounded bg-sky-100 px-1.5 py-0.2 text-[10px] font-semibold text-sky-800">
            {weather.monsoonStatus || t.weather.activeMonsoon}
          </span>
          {weather.forecastRainProbability > 40 && (
            <span className="text-blue-700 font-medium text-[11px]">
              🌧️ {weather.forecastRainProbability}% Rain
            </span>
          )}
        </div>

        {/* 3-Phase Grid Feeder Status */}
        <div className="flex items-center space-x-1.5 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-700">
          <Zap className="h-3 w-3 text-amber-500" />
          <span>{systemStatus.powerFeederStatus || '3-Phase Active'}</span>
        </div>
      </div>

      {/* Right Controls: Units, Language, Sim Speed, Assistant */}
      <div className="flex items-center space-x-2 sm:space-x-2.5">
        {/* Unit Selector (Acre vs Ha) */}
        <div className="flex items-center rounded-lg border border-stone-200 bg-stone-50 p-0.5 text-xs">
          <button
            onClick={() => setUnitSystem('acre')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              unitSystem === 'acre'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t.acre}
          </button>
          <button
            onClick={() => setUnitSystem('hectare')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              unitSystem === 'hectare'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t.hectare}
          </button>
        </div>

        {/* Language Selector (EN | हिंदी | मराठी) */}
        <div className="flex items-center space-x-1 rounded-lg border border-stone-200 bg-stone-50 p-0.5 text-xs">
          <Languages className="h-3.5 w-3.5 text-stone-400 ml-1" />
          {(['en', 'hi', 'mr'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                language === l
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {l === 'en' ? 'EN' : l === 'hi' ? 'हिंदी' : 'मराठी'}
            </button>
          ))}
        </div>



        {/* Theme Toggle (Light / Dark Mode) */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-200 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-500" />
          ) : (
            <Moon className="h-4 w-4 text-stone-700" />
          )}
        </button>

        {/* AI Assistant Chat Trigger */}
        <button
          onClick={onOpenAssistant}
          className="flex items-center space-x-1.5 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Bot className="h-3.5 w-3.5 text-emerald-200" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>
      </div>
    </header>
  );
};
