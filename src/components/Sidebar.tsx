import React from 'react';
import {
  LayoutDashboard,
  Sprout,
  Activity,
  Cpu,
  Droplet,
  FlaskConical,
  ScanEye,
  Bell,
  History,
  FlaskRound,
  Network,
  BookOpen,
  Settings,
  Wrench,
  Brain,
  BarChart3,
} from 'lucide-react';
import { useTranslation } from '../locales/LanguageContext';

interface SidebarProps {
  currentPage: string;
  onSelectPage: (page: string) => void;
  activeAlertsCount: number;
  pendingDecisionsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  activeAlertsCount,
  pendingDecisionsCount,
}) => {
  const { t } = useTranslation();

  const mainNav = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'agent', label: t.nav.agent, icon: Cpu },
    { id: 'tools', label: t.nav.tools || 'Tool Registry & Workbench', icon: Wrench },
    { id: 'memory', label: t.nav.memory || 'Agent Memory Inspector', icon: Brain },
    { id: 'metrics', label: t.nav.metrics || 'Agent Metrics & Safety', icon: BarChart3 },
    { id: 'plots', label: t.nav.plots, icon: Sprout },
    { id: 'sensors', label: t.nav.sensors, icon: Activity },
    {
      id: 'irrigation',
      label: t.nav.irrigation,
      icon: Droplet,
      badge: pendingDecisionsCount > 0 ? pendingDecisionsCount : undefined,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    { id: 'fertilization', label: t.nav.fertilization, icon: FlaskConical },
    { id: 'cropHealth', label: t.nav.cropHealth, icon: ScanEye },
    {
      id: 'alerts',
      label: t.nav.alerts,
      icon: Bell,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    { id: 'history', label: t.nav.history, icon: History },
  ];

  const academicNav = [
    { id: 'scenarios', label: t.nav.scenarios, icon: FlaskRound },
    { id: 'architecture', label: t.nav.architecture, icon: Network },
    { id: 'peas', label: t.nav.peas, icon: BookOpen },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  return (
    <aside
      id="agro-sidebar"
      className="flex w-64 flex-col border-r border-stone-200 bg-stone-50/75 p-3 text-stone-700"
    >
      {/* Primary Navigation */}
      <div className="mb-4">
        <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-600">
          Agent Operations (कृषी कृती)
        </div>
        <nav className="mt-1 space-y-0.5">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? 'text-white' : 'text-stone-500 group-hover:text-stone-700'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive ? 'bg-white text-emerald-800' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Academic & Architecture Section */}
      <div className="mt-auto border-t border-stone-200 pt-3">
        <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-600">
          Evaluations & India Specs
        </div>
        <nav className="mt-1 space-y-0.5">
          {academicNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`group flex w-full items-center space-x-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? 'text-white' : 'text-stone-500 group-hover:text-stone-700'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Indian Agronomic Standards Badge */}
      <div className="mt-4 rounded-lg border border-stone-200 bg-white p-2.5 text-[11px] text-stone-500 shadow-xs">
        <div className="font-semibold text-stone-800">ICAR & KVK Standards</div>
        <div className="text-[10px] text-stone-600">
          Indian Model • Hybrid Rule & AI • 14.5 Acres
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-stone-600">
          <span>Zero-Fabrication</span>
          <span className="text-emerald-700 font-medium">100% Guarded</span>
        </div>
      </div>
    </aside>
  );
};
