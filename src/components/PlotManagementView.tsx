import React, { useState } from 'react';
import {
  Sprout,
  Plus,
  Sliders,
  Droplets,
  Layers,
  Sparkles,
  Check,
  X,
  FileText,
  AlertTriangle,
  Calendar,
  Waves,
} from 'lucide-react';
import {
  Plot,
  CropType,
  GrowthStage,
  SoilType,
  IrrigationMethod,
  WaterSource,
  CroppingSeason,
  SoilHealthCardData,
} from '../types';
import { useTranslation } from '../locales/LanguageContext';
import {
  INDIAN_CROP_DATABASE,
  INDIAN_SOIL_DATABASE,
  INDIAN_WATER_SOURCES,
  INDIAN_IRRIGATION_METHODS,
  CROPPING_SEASONS,
} from '../data/indianAgriData';
import { api } from '../services/api';

interface PlotManagementViewProps {
  plots: Plot[];
  onSavePlot: (plot: Partial<Plot>) => void;
}

export const PlotManagementView: React.FC<PlotManagementViewProps> = ({
  plots,
  onSavePlot,
}) => {
  const { t, language, formatArea } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShcModalOpen, setIsShcModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Partial<Plot> | null>(null);
  const [shcPlotId, setShcPlotId] = useState<string>('');
  const [shcForm, setShcForm] = useState<SoilHealthCardData>({
    hasCard: true,
    sampleId: '',
    testDate: new Date().toISOString().split('T')[0],
    testingLab: 'Krishi Vigyan Kendra (KVK)',
    organicCarbonPercent: 0.55,
    electricalConductivityDsM: 0.45,
    availableNitrogenKgHa: 180,
    availablePhosphorusKgHa: 28,
    availablePotassiumKgHa: 210,
    zincPpm: 0.8,
    ironPpm: 5.2,
    boronPpm: 0.4,
    sulphurPpm: 12.0,
  });

  const cropKeys = Object.keys(INDIAN_CROP_DATABASE) as CropType[];
  const soilKeys = Object.keys(INDIAN_SOIL_DATABASE) as SoilType[];

  const growthStages: GrowthStage[] = [
    'Germination',
    'Vegetative',
    'Tillering',
    'Crown Root Initiation (CRI)',
    'Square Formation',
    'Flowering',
    'Boll Formation / Pod Filling',
    'Fruit Development',
    'Grain Filling',
    'Maturation / Harvest',
  ];

  const handleOpenAdd = () => {
    setEditingPlot({
      name: `Plot Zone ${plots.length + 1}`,
      cropType: 'Rice',
      growthStage: 'Tillering',
      season: 'Kharif',
      soilType: 'Clay',
      irrigationMethod: 'Drip Irrigation',
      waterSource: 'Borewell / Tube Well',
      areaAcre: 3.5,
      areaHa: 1.4,
      targetMoistureRange: { min: 70, optimal: 85, max: 95 },
      currentMoisture: 75,
      currentPh: 6.8,
      soilHealthCard: {
        hasCard: false,
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plot: Plot) => {
    setEditingPlot({ ...plot });
    setIsModalOpen(true);
  };

  const handleOpenShc = (plot: Plot) => {
    setShcPlotId(plot.id);
    if (plot.soilHealthCard?.hasCard) {
      setShcForm({ ...plot.soilHealthCard });
    } else {
      setShcForm({
        hasCard: true,
        sampleId: `SHC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        testDate: new Date().toISOString().split('T')[0],
        testingLab: 'Krishi Vigyan Kendra (KVK)',
        organicCarbonPercent: 0.62,
        electricalConductivityDsM: 0.48,
        availableNitrogenKgHa: plot.nitrogenMgKg ? Math.round(plot.nitrogenMgKg * 2.24) : 180,
        availablePhosphorusKgHa: plot.phosphorusMgKg ? Math.round(plot.phosphorusMgKg * 2.24) : 25,
        availablePotassiumKgHa: plot.potassiumMgKg ? Math.round(plot.potassiumMgKg * 2.24) : 220,
        zincPpm: 0.85,
        ironPpm: 5.4,
        boronPpm: 0.45,
        sulphurPpm: 14.0,
      });
    }
    setIsShcModalOpen(true);
  };

  const handleSubmitPlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlot) {
      onSavePlot(editingPlot);
      setIsModalOpen(false);
      setEditingPlot(null);
    }
  };

  const handleSaveShc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSoilHealthCard(shcPlotId, shcForm);
      setIsShcModalOpen(false);
      // Trigger parent save or reload by calling onSavePlot
      const plot = plots.find((p) => p.id === shcPlotId);
      if (plot) {
        onSavePlot({
          id: plot.id,
          soilHealthCard: shcForm,
          nitrogenMgKg: Math.round((shcForm.availableNitrogenKgHa || 180) / 2.24),
          phosphorusMgKg: Math.round((shcForm.availablePhosphorusKgHa || 25) / 2.24),
          potassiumMgKg: Math.round((shcForm.availablePotassiumKgHa || 220) / 2.24),
        });
      }
    } catch (err) {
      console.error('Error saving Soil Health Card:', err);
    }
  };

  const getCropDisplayName = (cropType: string) => {
    const crop = INDIAN_CROP_DATABASE[cropType as CropType];
    if (!crop) return cropType;
    if (language === 'hi') return `${crop.nameHi} (${crop.nameEn})`;
    if (language === 'mr') return `${crop.nameMr} (${crop.nameEn})`;
    return `${crop.nameEn} (${crop.nameHi} / ${crop.nameMr})`;
  };

  return (
    <div id="plot-management-view" className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-stone-900">
            {t.plotsTitle || 'Indian Agricultural Plots & Crop Zones'}
          </h2>
          <p className="text-xs text-stone-500">
            Define Kharif/Rabi/Zaid crop zones, Indian soil classifications, water sources (Borewell, Shettale, Canal), and KVK Soil Health Cards.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-medium text-white shadow-xs hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Indian Plot</span>
        </button>
      </div>

      {/* Plot Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
        {plots.map((plot) => {
          const hasSHC = plot.soilHealthCard?.hasCard;

          return (
            <div
              key={plot.id}
              className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-stone-900">{plot.name}</h3>
                    <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-mono text-stone-600">
                      {plot.id}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-stone-600">
                    <span className="font-semibold text-emerald-800">
                      {getCropDisplayName(plot.cropType)}
                    </span>
                    <span>•</span>
                    <span className="rounded bg-amber-50 px-1.5 py-0.2 text-[10px] font-medium text-amber-800 border border-amber-200">
                      {plot.season || 'Kharif'}
                    </span>
                    <span>•</span>
                    <span>{plot.growthStage} Stage</span>
                    <span>•</span>
                    <span>{formatArea(plot.areaAcre, plot.areaHa)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenShc(plot)}
                    title="Manage Soil Health Card"
                    className={`flex items-center space-x-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                      hasSHC
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-amber-300 bg-amber-50 text-amber-800'
                    }`}
                  >
                    <FileText className="h-3 w-3" />
                    <span>{hasSHC ? 'SHC Card' : 'Add SHC'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(plot)}
                    className="flex items-center space-x-1 rounded-md border border-stone-200 px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-50"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>Configure</span>
                  </button>
                </div>
              </div>

              {/* Config Specs Grid */}
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-stone-50 p-3 text-xs">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-stone-600">Soil Class</div>
                  <div className="mt-0.5 font-medium text-stone-800 truncate" title={plot.soilType}>
                    {plot.soilType}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-stone-600">Water Source</div>
                  <div className="mt-0.5 font-medium text-stone-800 truncate" title={plot.waterSource}>
                    {plot.waterSource || 'Borewell'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-stone-600">Target Moisture</div>
                  <div className="mt-0.5 font-mono font-medium text-emerald-800">
                    {plot.targetMoistureRange.min}% - {plot.targetMoistureRange.max}%
                  </div>
                </div>
              </div>

              {/* Nutrients & Soil Health Card Banner */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 text-xs text-stone-500">
                <div>
                  <span className="font-medium text-stone-700">Soil pH:</span>{' '}
                  {plot.currentPh ? plot.currentPh.toFixed(1) : 'Not tested'}
                </div>
                <div>
                  {hasSHC ? (
                    <span className="flex items-center space-x-1 text-emerald-700 font-medium">
                      <Check className="h-3.5 w-3.5" />
                      <span>
                        N:{plot.nitrogenMgKg} P:{plot.phosphorusMgKg} K:{plot.potassiumMgKg} mg/kg (Verified)
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-amber-700 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Zero-Fabrication: NPK Missing (KVK Test Advised)</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plot Edit / Add Modal */}
      {isModalOpen && editingPlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-stone-900 text-base">
                {editingPlot.id ? 'Configure Indian Plot Zone' : 'Register New Indian Plot'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPlot} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-700">Plot Name</label>
                <input
                  type="text"
                  required
                  value={editingPlot.name || ''}
                  onChange={(e) => setEditingPlot({ ...editingPlot, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900 focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700">Crop (Indian Database)</label>
                  <select
                    value={editingPlot.cropType}
                    onChange={(e) => {
                      const ct = e.target.value as CropType;
                      const crop = INDIAN_CROP_DATABASE[ct];
                      const defaultRange =
                        crop?.defaultMoistureByStage?.[editingPlot.growthStage || 'Vegetative'] || {
                          min: 40,
                          optimal: 60,
                          max: 80,
                        };
                      setEditingPlot({
                        ...editingPlot,
                        cropType: ct,
                        targetMoistureRange: defaultRange,
                      });
                    }}
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900"
                  >
                    {cropKeys.map((c) => (
                      <option key={c} value={c}>
                        {INDIAN_CROP_DATABASE[c]?.nameEn} ({INDIAN_CROP_DATABASE[c]?.nameHi})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-stone-700">Cropping Season</label>
                  <select
                    value={editingPlot.season || 'Kharif'}
                    onChange={(e) =>
                      setEditingPlot({
                        ...editingPlot,
                        season: e.target.value as CroppingSeason,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900"
                  >
                    {CROPPING_SEASONS.map((s: CroppingSeason) => (
                      <option key={s} value={s}>
                        {s} Season
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700">Growth Stage</label>
                  <select
                    value={editingPlot.growthStage}
                    onChange={(e) =>
                      setEditingPlot({ ...editingPlot, growthStage: e.target.value as GrowthStage })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900"
                  >
                    {growthStages.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-stone-700">Area (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    max="100"
                    value={editingPlot.areaAcre || 3.5}
                    onChange={(e) => {
                      const acre = Number(e.target.value);
                      setEditingPlot({
                        ...editingPlot,
                        areaAcre: acre,
                        areaHa: +(acre / 2.471).toFixed(2),
                      });
                    }}
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700">Soil Classification</label>
                  <select
                    value={editingPlot.soilType}
                    onChange={(e) =>
                      setEditingPlot({ ...editingPlot, soilType: e.target.value as SoilType })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900"
                  >
                    {soilKeys.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-stone-700">Irrigation Method</label>
                  <select
                    value={editingPlot.irrigationMethod}
                    onChange={(e) =>
                      setEditingPlot({
                        ...editingPlot,
                        irrigationMethod: e.target.value as IrrigationMethod,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900"
                  >
                    {INDIAN_IRRIGATION_METHODS.map((m: IrrigationMethod) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700">Water Source</label>
                <select
                  value={editingPlot.waterSource || 'Borewell / Tube Well'}
                  onChange={(e) =>
                    setEditingPlot({
                      ...editingPlot,
                      waterSource: e.target.value as WaterSource,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900"
                >
                  {INDIAN_WATER_SOURCES.map((w: WaterSource) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-stone-700">
                  Target Moisture Envelope (VWC %)
                </label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-stone-500">Min Threshold</span>
                    <input
                      type="number"
                      min={10}
                      max={80}
                      value={editingPlot.targetMoistureRange?.min ?? 50}
                      onChange={(e) =>
                        setEditingPlot({
                          ...editingPlot,
                          targetMoistureRange: {
                            min: Number(e.target.value),
                            optimal: editingPlot.targetMoistureRange?.optimal ?? 65,
                            max: editingPlot.targetMoistureRange?.max ?? 80,
                          },
                        })
                      }
                      className="w-full rounded border border-stone-300 p-1.5 text-center font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500">Optimal Target</span>
                    <input
                      type="number"
                      min={20}
                      max={90}
                      value={editingPlot.targetMoistureRange?.optimal ?? 65}
                      onChange={(e) =>
                        setEditingPlot({
                          ...editingPlot,
                          targetMoistureRange: {
                            min: editingPlot.targetMoistureRange?.min ?? 50,
                            optimal: Number(e.target.value),
                            max: editingPlot.targetMoistureRange?.max ?? 80,
                          },
                        })
                      }
                      className="w-full rounded border border-stone-300 p-1.5 text-center font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500">Max Ceiling</span>
                    <input
                      type="number"
                      min={30}
                      max={98}
                      value={editingPlot.targetMoistureRange?.max ?? 80}
                      onChange={(e) =>
                        setEditingPlot({
                          ...editingPlot,
                          targetMoistureRange: {
                            min: editingPlot.targetMoistureRange?.min ?? 50,
                            optimal: editingPlot.targetMoistureRange?.optimal ?? 65,
                            max: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full rounded border border-stone-300 p-1.5 text-center font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 border-t border-stone-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-800 px-4 py-1.5 font-medium text-white shadow-xs hover:bg-emerald-700"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Soil Health Card Modal */}
      {isShcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-emerald-700" />
                <h3 className="font-bold text-stone-900 text-base">
                  {t.soilHealthCard || 'Krishi Vigyan Kendra (KVK) Soil Health Card'}
                </h3>
              </div>
              <button
                onClick={() => setIsShcModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShc} className="mt-4 space-y-4 text-xs">
              <div className="rounded-lg bg-emerald-50 p-3 text-emerald-900 text-xs border border-emerald-200">
                <strong>Zero-Fabrication Mandate:</strong> The AgroGenesis agent strictly verifies laboratory Soil Health Card parameters to calculate safe Urea, DAP, and MOP dosages.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700">Sample Card ID</label>
                  <input
                    type="text"
                    required
                    value={shcForm.sampleId || ''}
                    onChange={(e) => setShcForm({ ...shcForm, sampleId: e.target.value })}
                    placeholder="e.g. MH-THN-2026-8812"
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700">Testing Laboratory</label>
                  <input
                    type="text"
                    required
                    value={shcForm.testingLab || ''}
                    onChange={(e) => setShcForm({ ...shcForm, testingLab: e.target.value })}
                    placeholder="KVK / District Agri Lab"
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-stone-700">Avail. N (kg/ha)</label>
                  <input
                    type="number"
                    required
                    min="20"
                    max="600"
                    value={shcForm.availableNitrogenKgHa ?? 180}
                    onChange={(e) =>
                      setShcForm({ ...shcForm, availableNitrogenKgHa: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700">Avail. P (kg/ha)</label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="150"
                    value={shcForm.availablePhosphorusKgHa ?? 25}
                    onChange={(e) =>
                      setShcForm({ ...shcForm, availablePhosphorusKgHa: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700">Avail. K (kg/ha)</label>
                  <input
                    type="number"
                    required
                    min="50"
                    max="600"
                    value={shcForm.availablePotassiumKgHa ?? 220}
                    onChange={(e) =>
                      setShcForm({ ...shcForm, availablePotassiumKgHa: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700">Organic Carbon (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="2.5"
                    value={shcForm.organicCarbonPercent ?? 0.55}
                    onChange={(e) =>
                      setShcForm({ ...shcForm, organicCarbonPercent: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700">EC Salinity (dS/m)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="8.0"
                    value={shcForm.electricalConductivityDsM ?? 0.45}
                    onChange={(e) =>
                      setShcForm({ ...shcForm, electricalConductivityDsM: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-stone-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-stone-600">Zinc (ppm)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={shcForm.zincPpm ?? 0.8}
                    onChange={(e) => setShcForm({ ...shcForm, zincPpm: Number(e.target.value) })}
                    className="w-full rounded border border-stone-300 p-1 text-center font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-stone-600">Iron (ppm)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={shcForm.ironPpm ?? 5.2}
                    onChange={(e) => setShcForm({ ...shcForm, ironPpm: Number(e.target.value) })}
                    className="w-full rounded border border-stone-300 p-1 text-center font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-stone-600">Boron (ppm)</span>
                  <input
                    type="number"
                    step="0.05"
                    value={shcForm.boronPpm ?? 0.4}
                    onChange={(e) => setShcForm({ ...shcForm, boronPpm: Number(e.target.value) })}
                    className="w-full rounded border border-stone-300 p-1 text-center font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-stone-600">Sulphur (ppm)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={shcForm.sulphurPpm ?? 12.0}
                    onChange={(e) => setShcForm({ ...shcForm, sulphurPpm: Number(e.target.value) })}
                    className="w-full rounded border border-stone-300 p-1 text-center font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 border-t border-stone-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsShcModalOpen(false)}
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-800 px-4 py-1.5 font-medium text-white shadow-xs hover:bg-emerald-700"
                >
                  Save Soil Health Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
