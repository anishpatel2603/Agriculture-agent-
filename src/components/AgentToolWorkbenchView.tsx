import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Search,
  Code,
  Layers,
  ChevronRight,
  Send,
  RefreshCw,
} from 'lucide-react';
import { ToolDefinition, ToolExecutionRecord, AgentToolName } from '../types';
import { api } from '../services/api';

export const AgentToolWorkbenchView: React.FC = () => {
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [history, setHistory] = useState<ToolExecutionRecord[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [jsonParams, setJsonParams] = useState<string>('{}');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchToolsData = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAgentTools();
      setTools(data.tools || []);
      setHistory(data.history || []);
      if (data.tools && data.tools.length > 0 && !selectedTool) {
        setSelectedTool(data.tools[0]);
        prepareSampleParams(data.tools[0]);
      }
    } catch (err) {
      console.error('Failed to load agent tools:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchToolsData();
  }, []);

  const prepareSampleParams = (tool: ToolDefinition) => {
    switch (tool.name) {
      case 'getSensorReadings':
        setJsonParams(JSON.stringify({ plotId: 'plot-1', limit: 5 }, null, 2));
        break;
      case 'validateSensorData':
        setJsonParams(JSON.stringify({ plotId: 'plot-1', sensorType: 'soil_moisture', value: 58.4 }, null, 2));
        break;
      case 'getCropProfile':
        setJsonParams(JSON.stringify({ cropType: 'Rice' }, null, 2));
        break;
      case 'getSoilProfile':
        setJsonParams(JSON.stringify({ soilType: 'Black Cotton Soil (Regur)' }, null, 2));
        break;
      case 'analyzeIrrigationNeed':
        setJsonParams(JSON.stringify({ plotId: 'plot-1' }, null, 2));
        break;
      case 'analyzeFertilizationNeed':
        setJsonParams(JSON.stringify({ plotId: 'plot-2' }, null, 2));
        break;
      case 'analyzeCropHealth':
        setJsonParams(JSON.stringify({ plotId: 'plot-1', notes: 'Leaves show slight yellowing at margin' }, null, 2));
        break;
      case 'createAlert':
        setJsonParams(JSON.stringify({
          plotId: 'plot-1',
          severity: 'WARNING',
          category: 'MOISTURE',
          title: 'Manual Test Soil Moisture Alert',
          message: 'Telemetry indicates root-zone moisture below optimal ICAR range.',
        }, null, 2));
        break;
      case 'simulateIrrigation':
        setJsonParams(JSON.stringify({ plotId: 'plot-1', durationMinutes: 15 }, null, 2));
        break;
      default:
        setJsonParams('{}');
    }
  };

  const handleSelectTool = (tool: ToolDefinition) => {
    setSelectedTool(tool);
    prepareSampleParams(tool);
    setExecutionResult(null);
  };

  const handleExecuteTool = async () => {
    if (!selectedTool) return;
    setIsExecuting(true);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(jsonParams);
      } catch (e) {
        alert('Invalid JSON input parameters');
        setIsExecuting(false);
        return;
      }
      const res = await api.executeAgentTool(selectedTool.name, parsed);
      setExecutionResult(res);
      // Refresh history
      const freshData = await api.getAgentTools();
      setHistory(freshData.history || []);
    } catch (err: any) {
      setExecutionResult({ success: false, error: err?.message || 'Execution error' });
    } finally {
      setIsExecuting(false);
    }
  };

  const categories = ['ALL', 'PERCEPTION', 'KNOWLEDGE', 'ANALYSIS', 'SAFETY_APPROVAL', 'ACTUATION'];

  const filteredTools = tools.filter((t) => {
    const matchesCat = filterCategory === 'ALL' || t.category === filterCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div id="agent-tool-workbench" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <Wrench className="h-5 w-5 text-emerald-800" />
            <h2 className="text-lg font-bold text-stone-900">
              Agent Tool Registry & Interactive Execution Workbench
            </h2>
          </div>
          <p className="text-xs text-stone-500">
            Backend allowlisted tool catalog. The autonomous agent selects and executes these tools to perceive telemetry, reason, and act.
          </p>
        </div>

        <button
          onClick={fetchToolsData}
          className="flex items-center space-x-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-xs hover:bg-stone-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Tools</span>
        </button>
      </div>

      {/* Main Grid: Tool List vs Interactive Runner */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Tool Catalog (5 cols) */}
        <div className="space-y-3 lg:col-span-5">
          {/* Filters */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search tools by name, category, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-stone-50/50 py-1.5 pl-8 pr-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                    filterCategory === cat
                      ? 'bg-emerald-800 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tools List */}
          <div className="max-h-[600px] space-y-2 overflow-y-auto pr-1">
            {filteredTools.map((tool) => {
              const isSelected = selectedTool?.name === tool.name;
              return (
                <div
                  key={tool.name}
                  onClick={() => handleSelectTool(tool)}
                  className={`cursor-pointer rounded-xl border p-3 text-xs transition-all ${
                    isSelected
                      ? 'border-emerald-700 bg-emerald-50/60 shadow-sm ring-1 ring-emerald-700'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-stone-900">{tool.displayName}</span>
                      <div className="font-mono text-[10px] text-emerald-800">{tool.name}()</div>
                    </div>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        tool.category === 'PERCEPTION'
                          ? 'bg-blue-100 text-blue-900'
                          : tool.category === 'KNOWLEDGE'
                          ? 'bg-purple-100 text-purple-900'
                          : tool.category === 'ANALYSIS'
                          ? 'bg-amber-100 text-amber-900'
                          : tool.category === 'SAFETY_APPROVAL'
                          ? 'bg-orange-100 text-orange-900'
                          : 'bg-rose-100 text-rose-900'
                      }`}
                    >
                      {tool.category}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-stone-600 line-clamp-2">{tool.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Tool Specification & Execution Runner (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          {selectedTool ? (
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Code className="h-4 w-4 text-emerald-800" />
                    <h3 className="text-base font-bold text-stone-900">{selectedTool.displayName}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700">
                      <Shield className="h-3 w-3 text-stone-500" />
                      {selectedTool.permissionRequirements}
                    </span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                      {selectedTool.executionStatus}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-stone-600">{selectedTool.description}</p>
              </div>

              {/* Validation Rules */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">Deterministic Safety & Validation Rules</h4>
                <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs text-stone-700">
                  {selectedTool.validationRules.map((rule, i) => (
                    <li key={i}>{rule}</li>
                  ))}
                </ul>
              </div>

              {/* Input Schema Parameters */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">Input Schema Specification</h4>
                <div className="mt-1.5 rounded-lg border border-stone-200 bg-stone-50 p-2.5 font-mono text-[11px] text-stone-800 max-h-36 overflow-y-auto">
                  {Object.entries(selectedTool.inputSchema.properties || {}).map(([paramName, paramDef]: any) => (
                    <div key={paramName} className="py-0.5">
                      <span className="font-bold text-emerald-900">{paramName}</span>
                      <span className="text-stone-600"> ({paramDef.type})</span>
                      {paramDef.required && <span className="text-rose-600 font-bold"> *required</span>}
                      <span className="text-stone-600"> — {paramDef.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Execution Console */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Execution Payload (JSON Arguments)
                  </span>
                  <button
                    onClick={() => prepareSampleParams(selectedTool)}
                    className="text-[11px] text-emerald-800 hover:underline"
                  >
                    Reset Sample Parameters
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={jsonParams}
                  onChange={(e) => setJsonParams(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-stone-900 p-3 font-mono text-xs text-emerald-400 focus:border-emerald-600 focus:outline-none"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleExecuteTool}
                    disabled={isExecuting}
                    className="flex items-center space-x-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Executing Tool...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        <span>Run Tool Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Output Result */}
              {executionResult && (
                <div className="space-y-1.5 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700">Execution Output</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        executionResult.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {executionResult.success ? 'SUCCESS (200 OK)' : 'FAILED'}
                    </span>
                  </div>
                  <pre className="max-h-60 overflow-y-auto rounded-lg border border-stone-200 bg-stone-900 p-3 font-mono text-[11px] text-stone-100">
                    {JSON.stringify(executionResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-xs text-stone-500">
              Select a tool from the catalog to inspect schema and test execution.
            </div>
          )}
        </div>
      </div>

      {/* Recent Tool Execution Audit Trail */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-emerald-800" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700">
              Recent Tool Execution Audit History
            </h3>
          </div>
          <span className="text-xs text-stone-500">{history.length} logged tool calls</span>
        </div>

        <div className="mt-3 max-h-64 overflow-y-auto">
          {history.length === 0 ? (
            <div className="py-6 text-center text-xs text-stone-400">
              No tool executions recorded yet. Run a tool or start the agent loop to populate logs.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold text-stone-600">
                <tr>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Tool Name</th>
                  <th className="py-2 px-3">Triggered By</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Latency</th>
                  <th className="py-2 px-3">Payload Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                {history.map((rec) => (
                  <tr key={rec.id} className="hover:bg-stone-50/50">
                    <td className="py-2 px-3 text-stone-500">
                      {new Date(rec.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 font-bold text-stone-900">{rec.toolName}</td>
                    <td className="py-2 px-3 text-stone-600">{rec.triggeredBy}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          rec.executionStatus === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {rec.executionStatus}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-stone-600">{rec.durationMs}ms</td>
                    <td className="py-2 px-3 text-stone-700 max-w-xs truncate">
                      {JSON.stringify(rec.inputSummary)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
