import React, { useState } from 'react';
import {
  ScanEye,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileImage,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Plot, CropHealthAnalysis } from '../types';
import { api } from '../services/api';

interface CropHealthViewProps {
  plots: Plot[];
}

export const CropHealthView: React.FC<CropHealthViewProps> = ({ plots }) => {
  const [selectedPlotId, setSelectedPlotId] = useState<string>(plots[0]?.id || '');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMimeType, setSelectedMimeType] = useState<string>('image/jpeg');
  const [sampleTitle, setSampleTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<CropHealthAnalysis | null>(null);

  // Manual symptom checklist
  const [symptoms, setSymptoms] = useState({
    yellowingLeaves: false,
    brownMargins: false,
    wilting: false,
    powderySpots: false,
    stuntedGrowth: false,
  });

  const sampleImages = [
    {
      title: 'Healthy Tomato Leaf',
      desc: 'Uniform vibrant green chlorophyll, intact cuticle',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23ecfdf5"/><path d="M150,20 C180,60 260,80 240,150 C220,180 150,190 150,190 C150,190 80,180 60,150 C40,80 120,60 150,20 Z" fill="%2310b981"/><path d="M150,20 L150,190" stroke="%23047857" stroke-width="3"/><path d="M150,70 L200,90 M150,100 L210,130 M150,130 L190,160 M150,70 L100,90 M150,100 L90,130 M150,130 L110,160" stroke="%23047857" stroke-width="2"/><text x="150" y="195" font-family="sans-serif" font-size="11" text-anchor="middle" fill="%23064e3b">Healthy Foliage</text></svg>`,
    },
    {
      title: 'Early Blight Symptoms',
      desc: 'Brown necrotic concentric rings, leaf margin decay',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23fffbeb"/><path d="M150,20 C180,60 260,80 240,150 C220,180 150,190 150,190 C150,190 80,180 60,150 C40,80 120,60 150,20 Z" fill="%23a7f3d0"/><path d="M150,20 L150,190" stroke="%23059669" stroke-width="2.5"/><circle cx="120" cy="110" r="22" fill="%2378350f" stroke="%23b45309" stroke-width="2"/><circle cx="120" cy="110" r="14" fill="%23451a03"/><circle cx="180" cy="80" r="16" fill="%2378350f" stroke="%23b45309" stroke-width="2"/><path d="M220,130 C235,140 240,160 230,170" stroke="%2378350f" stroke-width="6"/><text x="150" y="195" font-family="sans-serif" font-size="11" text-anchor="middle" fill="%2378350f">Early Blight Lesions</text></svg>`,
    },
    {
      title: 'Nitrogen Chlorosis',
      desc: 'Interveinal pale yellowing across mature lower leaves',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23fefce8"/><path d="M150,20 C180,60 260,80 240,150 C220,180 150,190 150,190 C150,190 80,180 60,150 C40,80 120,60 150,20 Z" fill="%23fef08a"/><path d="M150,20 L150,190" stroke="%2384cc16" stroke-width="2.5"/><path d="M150,70 L200,90 M150,100 L210,130 M150,70 L100,90 M150,100 L90,130" stroke="%2384cc16" stroke-width="2"/><text x="150" y="195" font-family="sans-serif" font-size="11" text-anchor="middle" fill="%23854d0e">Nutrient Chlorosis</text></svg>`,
    },
    {
      title: 'Drought Moisture Stress',
      desc: 'Wilted leaf turgor, inward curl, desiccated tip',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f5f5f4"/><path d="M150,20 C165,50 200,80 180,140 C170,170 150,190 150,190 C150,190 130,170 120,140 C100,80 135,50 150,20 Z" fill="%23d6d3d1" stroke="%23a8a29e"/><path d="M150,20 L150,190" stroke="%2378716c" stroke-width="2"/><text x="150" y="195" font-family="sans-serif" font-size="11" text-anchor="middle" fill="%2344403c">Drought Desiccation</text></svg>`,
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setSelectedMimeType(file.type || 'image/jpeg');
        setSampleTitle(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sample: (typeof sampleImages)[0]) => {
    setSelectedImage(sample.svg);
    setSelectedMimeType('image/svg+xml');
    setSampleTitle(sample.title);
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const activePlot = plots.find((p) => p.id === selectedPlotId) || plots[0];
      const result = await api.analyzeCropHealth({
        plotId: activePlot.id,
        imageBase64: selectedImage || undefined,
        mimeType: selectedMimeType,
        notes: `${sampleTitle ? `Sample: ${sampleTitle}. ` : ''}${notes}`,
      });
      setAnalysisResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div id="crop-health-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Crop Health Vision Diagnostic</h2>
          <p className="text-xs text-stone-500">
            Multi-modal foliage inspection powered by Gemini Vision with plant-pathology safety disclaimers.
          </p>
        </div>

        {/* Plot Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-medium text-stone-600">Assign to Zone:</span>
          <select
            value={selectedPlotId}
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

      {/* Main Grid: Upload & Inspection on Left, Analysis Report on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Image Acquisition & Pre-loaded Samples */}
        <div className="space-y-4">
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <h3 className="font-bold text-stone-900 text-sm">Image Upload & Foliage Capture</h3>
            <p className="text-xs text-stone-500">
              Select or drag-and-drop a leaf photograph, or test an instant benchmark sample.
            </p>

            {/* Upload Drag & Drop Area */}
            <label className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 bg-stone-50/70 p-6 text-center cursor-pointer transition-colors hover:border-emerald-500 hover:bg-emerald-50/30">
              <Upload className="h-7 w-7 text-stone-400" />
              <span className="mt-2 text-xs font-semibold text-stone-700">
                Click to browse or drag photo here
              </span>
              <span className="text-[10px] text-stone-500">Supports PNG, JPG, WEBP up to 10MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Pre-loaded Benchmark Samples */}
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                Or choose an instant benchmark leaf specimen:
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {sampleImages.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(s)}
                    className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-all ${
                      sampleTitle === s.title
                        ? 'border-emerald-700 bg-emerald-50/80 shadow-xs'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-xs font-bold text-stone-900">{s.title}</span>
                    <span className="mt-0.5 text-[10px] text-stone-500 leading-snug line-clamp-1">
                      {s.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Preview */}
            {selectedImage && (
              <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-3">
                <div className="flex items-center justify-between text-xs font-medium text-stone-700">
                  <span>Selected Specimen: {sampleTitle || 'Uploaded Image'}</span>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-stone-400 hover:text-stone-600 text-[11px]"
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-2 flex justify-center">
                  <img
                    src={selectedImage}
                    alt="Foliage preview"
                    referrerPolicy="no-referrer"
                    className="max-h-48 rounded-md border border-stone-200 object-contain shadow-xs"
                  />
                </div>
              </div>
            )}

            {/* Field Notes & Run Button */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-stone-700">
                Agronomic Field Observation Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Symptoms observed on lower canopy after 3 days of warm humid fog..."
                className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-xs text-stone-900 focus:border-emerald-700 focus:outline-hidden"
              />
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="mt-4 flex w-full items-center justify-center space-x-2 rounded-lg bg-emerald-800 py-2.5 font-medium text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isAnalyzing ? 'Analyzing with Gemini AI...' : 'Run Vision Health Diagnostic'}</span>
            </button>
          </div>
        </div>

        {/* Right: Diagnostic Report & Safety Disclaimer */}
        <div className="space-y-4">
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <h3 className="font-bold text-stone-900 text-sm">Vision Diagnostic Report</h3>
            <p className="text-xs text-stone-500">
              Model-synthesized plant pathology findings and recommended management practices
            </p>

            {analysisResult ? (
              <div className="mt-4 space-y-4 text-xs">
                {/* Health Status Pill */}
                <div className="flex items-center justify-between rounded-lg bg-stone-50 p-3 border border-stone-200">
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-stone-500">
                      Evaluated Status
                    </div>
                    <div className="mt-0.5 text-base font-bold text-stone-900">
                      {analysisResult.healthStatus.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-semibold text-stone-500">
                      Confidence
                    </div>
                    <div className="mt-0.5 font-mono text-base font-bold text-emerald-800">
                      {(analysisResult.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Visual Observations */}
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-stone-700 text-[11px]">
                    Visual Observations
                  </h4>
                  <ul className="mt-1.5 space-y-1 list-disc pl-4 text-stone-700">
                    {analysisResult.observations.map((obs: string, i: number) => (
                      <li key={i}>{obs}</li>
                    ))}
                  </ul>
                </div>

                {/* Possible Causes */}
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-stone-700 text-[11px]">
                    Differential Diagnosis / Possible Causes
                  </h4>
                  <ul className="mt-1.5 space-y-1 list-disc pl-4 text-stone-700">
                    {analysisResult.possibleCauses.map((cause, i) => (
                      <li key={i}>{cause}</li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Next Steps */}
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-stone-700 text-[11px]">
                    Recommended Agronomic Next Steps
                  </h4>
                  <ul className="mt-1.5 space-y-1 list-disc pl-4 text-stone-700">
                    {analysisResult.recommendedNextSteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>

                {/* Mandatory Academic Disclaimer */}
                <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-[11px] text-amber-900 leading-relaxed">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <AlertTriangle className="h-4 w-4 text-amber-700" />
                    <span>Academic & Research Safety Notice:</span>
                  </div>
                  <p className="mt-1">{analysisResult.disclaimer}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-stone-200 bg-stone-50/50 p-6 text-center text-xs text-stone-400">
                <ScanEye className="h-8 w-8 text-stone-300" />
                <p className="mt-2">No diagnostic executed yet.</p>
                <p className="text-[11px] text-stone-400">
                  Select an image and click "Run Vision Health Diagnostic" to start.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
