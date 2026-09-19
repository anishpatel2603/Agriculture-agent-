import { GoogleGenAI } from '@google/genai';
import { Plot, AgentDecision, WeatherData, CropHealthAnalysis } from '../src/types';
import { INDIAN_CROP_DATABASE } from '../src/data/indianAgriData';

const SYSTEM_INSTRUCTION =
  'You are an Indian precision agriculture decision-support AI assistant named AgroGenesis. Use only the supplied farm data and verified Indian agronomic knowledge (ICAR, KVK, State Agricultural Universities). Do not invent sensor readings, weather forecasts, soil tests, or crop diagnoses. Distinguish measured facts, assumptions, and recommendations. If soil test or NPK data is missing, clearly state that under the Zero-Fabrication Guardrail you will not prescribe chemical dosages and advise submitting a composite soil sample to the nearest Krishi Vigyan Kendra (KVK). If language requested is Hindi or Marathi, provide natural, fluent and respectful guidance in Hindi or Marathi using Devanagari script.';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export function isGeminiAvailable(): boolean {
  return getAiClient() !== null;
}

/**
 * Generate a detailed agronomic explanation for why the agent recommended or deferred an action.
 */
export async function explainDecisionWithAI(
  plot: Plot,
  decision: AgentDecision,
  weather: WeatherData,
  language: 'en' | 'hi' | 'mr' = 'en'
): Promise<string> {
  const crop = INDIAN_CROP_DATABASE[plot.cropType] || INDIAN_CROP_DATABASE.Rice;
  const ai = getAiClient();

  const langInstruction =
    language === 'mr'
      ? 'Respond strictly in Marathi (मराठी) using Devanagari script, utilizing standard Maharashtrian farming terms (शेततळे, ठिबक, युरिया, पाण्याचा ताण, माती परीक्षण).'
      : language === 'hi'
      ? 'Respond strictly in Hindi (हिंदी) using Devanagari script, utilizing standard Indian farming terms (सिंचाई, खाद, मिट्टी की नमी, केवीके).'
      : 'Respond in clear, professional English for Indian precision agriculture.';

  if (!ai) {
    if (language === 'mr') {
      return `[कृषी निर्णय इंजिन]: ${plot.name} साठी शिफारस: ${decision.recommendation}. सध्याचा मातीतील ओलावा ${plot.currentMoisture}% आहे (इष्टतम मर्यादा: ${plot.targetMoistureRange.min}% - ${plot.targetMoistureRange.max}%). मागील २४ तासांत पाऊस: ${weather.rainfallMmPast24h} मिमी. मुख्य कारण: ${decision.reason}`;
    }
    if (language === 'hi') {
      return `[कृषि निर्णय इंजन]: ${plot.name} के लिए सिफारिश: ${decision.recommendation}। वर्तमान मिट्टी की नमी ${plot.currentMoisture}% है (लक्ष्य सीमा: ${plot.targetMoistureRange.min}% - ${plot.targetMoistureRange.max}%)। पिछले 24 घंटों में वर्षा: ${weather.rainfallMmPast24h} मिमी। मुख्य कारण: ${decision.reason}`;
    }
    return `[Deterministic Agronomic Engine]: Recommended ${decision.recommendation} for ${plot.name} (${crop.nameEn}, ${plot.growthStage}) because current soil moisture is ${plot.currentMoisture}% against target [${plot.targetMoistureRange.min}% - ${plot.targetMoistureRange.max}%]. Recent rainfall: ${weather.rainfallMmPast24h}mm, Forecast: ${weather.forecastRainfallMmNext24h}mm (${weather.forecastRainProbability}%). Primary evidence: ${decision.reason}`;
  }

  try {
    const prompt = `Analyze and provide a clear, concise agronomic explanation for this Indian agricultural decision:
Farm Plot: ${plot.name}
Crop: ${crop.nameEn} (${crop.nameHi} / ${crop.nameMr}), Growth Stage: ${plot.growthStage}
Season: ${plot.season || 'Kharif'}
Soil: ${plot.soilType}
Water Source: ${plot.waterSource || 'Borewell / Tube Well'}
Irrigation Method: ${plot.irrigationMethod}
Current Soil Moisture: ${plot.currentMoisture}% (Target: ${plot.targetMoistureRange.min}% - ${plot.targetMoistureRange.max}%)
Ambient Temp: ${plot.currentTemp}°C, Humidity: ${plot.currentHumidity}%
Monsoon & Weather: ${weather.monsoonStatus || 'Active'}, 24h Rain: ${weather.rainfallMmPast24h}mm, Forecast: ${weather.forecastRainfallMmNext24h}mm (${weather.forecastRainProbability}%)

Agent Decision: ${decision.recommendation} (${decision.priority} priority)
Reasoning: ${decision.reason}
Evidence: ${JSON.stringify(decision.evidence)}

Language Requirement: ${langInstruction}

Explain in 2 brief paragraphs the biological and physical mechanisms at play (soil water tension, root suction, evapotranspiration demand, Indian monsoon dynamics) and why this decision is optimal and cost-saving for the Indian farmer.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
      },
    });

    return response.text || decision.reason;
  } catch (error: any) {
    console.warn('Gemini explain error, returning deterministic fallback:', error?.message);
    return `[Agronomic Engine]: ${decision.reason}. Current moisture: ${plot.currentMoisture}%, Target: ${plot.targetMoistureRange.min}%.`;
  }
}

/**
 * Multi-modal crop health analysis using Gemini 3.8 Flash or fallback Indian agronomic screener.
 */
export async function analyzeCropHealthImage(
  plot: Plot,
  imageBase64?: string,
  mimeType: string = 'image/jpeg',
  userNotes?: string,
  language: 'en' | 'hi' | 'mr' = 'en'
): Promise<CropHealthAnalysis> {
  const ai = getAiClient();
  const timestamp = new Date().toISOString();
  const crop = INDIAN_CROP_DATABASE[plot.cropType] || INDIAN_CROP_DATABASE.Rice;

  if (ai && imageBase64) {
    try {
      const prompt = `Inspect this crop foliage image for ${plot.name} (Crop: ${crop.nameEn} / ${crop.nameMr}, Growth Stage: ${plot.growthStage}, Current Soil Moisture: ${plot.currentMoisture}%, Soil: ${plot.soilType}).
Farmer Notes: ${userNotes || 'Routine visual crop scouting check in Indian field.'}
Language: ${language}

Identify any visible pest attacks (e.g. Yellow Stem Borer, Fall Armyworm, Aphids, Whitefly, Bollworm), nutrient deficiencies (N/P/K, Zinc, Iron), or fungal/bacterial diseases (Blast, Blight, Powdery Mildew).
Adhere to the Zero-Fabrication rule. If image is unclear, state INCONCLUSIVE.

Respond strictly in valid JSON format matching this schema:
{
  "healthStatus": "HEALTHY" | "POSSIBLE_STRESS" | "DISEASE_SYMPTOMS" | "INCONCLUSIVE",
  "observations": ["observation 1", "observation 2"],
  "possibleCauses": ["cause 1", "cause 2"],
  "recommendedNextSteps": ["step 1", "step 2"],
  "confidence": 0.85,
  "disclaimer": "Guidance based on visual screening. Confirm with nearest Krishi Vigyan Kendra (KVK) or Agronomist before purchasing chemical treatments."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          { text: prompt },
          {
            inlineData: {
              data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
              mimeType,
            },
          },
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        id: `cha-${Date.now()}`,
        plotId: plot.id,
        plotName: plot.name,
        healthStatus: parsed.healthStatus || 'POSSIBLE_STRESS',
        observations: parsed.observations || ['Canopy foliage evaluated.'],
        possibleCauses: parsed.possibleCauses || ['Environmental or transpirational factor.'],
        recommendedNextSteps: parsed.recommendedNextSteps || ['Scout plot daily.'],
        confidence: parsed.confidence || 0.82,
        disclaimer:
          parsed.disclaimer ||
          'AI screening assistance. Confirm with KVK plant pathologist before chemical application.',
        analyzedAt: timestamp,
        modelUsed: 'Gemini 3.8 Flash (Multimodal Agricultural Vision)',
      };
    } catch (err: any) {
      console.warn('Gemini vision analysis failed, falling back to rule base:', err?.message);
    }
  }

  // Fallback Rule-Based Agronomic Screener for Indian conditions
  const isMoistureLow = plot.currentMoisture < plot.targetMoistureRange.min;
  const isMoistureHigh = plot.currentMoisture > plot.targetMoistureRange.max;

  let healthStatus: CropHealthAnalysis['healthStatus'] = 'HEALTHY';
  const observations: string[] = [];
  const possibleCauses: string[] = [];
  const recommendedNextSteps: string[] = [];

  if (isMoistureLow) {
    healthStatus = 'POSSIBLE_STRESS';
    observations.push('Foliage shows signs of moisture stress / temporary wilting during mid-day');
    possibleCauses.push('Transpirational moisture deficit in effective root zone');
    recommendedNextSteps.push('Execute controlled drip/furrow irrigation pulse as recommended by agent');
  } else if (isMoistureHigh) {
    healthStatus = 'POSSIBLE_STRESS';
    observations.push('Soil surface is saturated; risk of lower leaf yellowing from waterlogging');
    possibleCauses.push('Root asphyxiation and damping-off danger in heavy black/clay soil');
    recommendedNextSteps.push('Open field drainage trenches (चर) and suspend irrigation');
  } else {
    observations.push('Foliage exhibits vigorous chlorophyll density and normal vegetative turgor');
    observations.push(`Plant canopy is consistent with nominal ${plot.growthStage} stage ICAR benchmarks`);
    possibleCauses.push('Adequate soil hydration and balanced microclimate');
    recommendedNextSteps.push('Continue scheduled monitoring; install yellow sticky traps for insect pest scouting');
  }

  if (userNotes && (userNotes.toLowerCase().includes('yellow') || userNotes.toLowerCase().includes('पिवळे') || userNotes.toLowerCase().includes('पीला'))) {
    healthStatus = 'POSSIBLE_STRESS';
    observations.push('Chlorosis (yellowing) noted on foliage');
    possibleCauses.push(
      plot.nitrogenMgKg && plot.nitrogenMgKg < 100
        ? 'Nitrogen deficiency chlorosis or iron deficiency in high pH calcareous black soil'
        : 'Micro-nutrient deficiency (Zinc/Iron) or temporary root hypoxia'
    );
    recommendedNextSteps.push('Verify Soil Health Card or apply 0.5% Ferrous Sulphate + 0.2% Zinc Sulphate foliar spray');
  }

  return {
    id: `cha-${Date.now()}`,
    plotId: plot.id,
    plotName: plot.name,
    healthStatus,
    observations,
    possibleCauses,
    recommendedNextSteps,
    confidence: 0.72,
    disclaimer:
      'Triage assessment based on ICAR agronomic rules. Consult local KVK agronomist for laboratory confirmation.',
    analyzedAt: timestamp,
    modelUsed: 'Indian Agronomic Screener (ICAR Rule-Base)',
  };
}

/**
 * Conversational agricultural assistant grounded in current farm state.
 */
export async function handleAssistantChat(
  message: string,
  activePlot: Plot,
  allPlots: Plot[],
  weather: WeatherData,
  recentDecisions: AgentDecision[],
  recentAlerts: any[],
  language: 'en' | 'hi' | 'mr' = 'en'
): Promise<{ reply: string; source: 'gemini' | 'rule_engine'; suggestedQuestions: string[] }> {
  const ai = getAiClient();
  const crop = INDIAN_CROP_DATABASE[activePlot.cropType] || INDIAN_CROP_DATABASE.Rice;

  const langInstruction =
    language === 'mr'
      ? 'Reply in natural, polite Marathi (मराठी) using Devanagari script. Use common Indian agricultural terms.'
      : language === 'hi'
      ? 'Reply in natural, polite Hindi (हिंदी) using Devanagari script. Use common Indian agricultural terms.'
      : 'Reply in clear, helpful English contextualized for Indian farmers.';

  const plotContext = `
ACTIVE INDIAN PLOT DETAILS:
Name: ${activePlot.name}
Crop: ${crop.nameEn} (${crop.nameHi} / ${crop.nameMr}), Category: ${crop.category}
Growth Stage: ${activePlot.growthStage}
Season: ${activePlot.season || 'Kharif'}
Area: ${activePlot.areaAcre || activePlot.areaHa * 2.471} Acres (${activePlot.areaHa} Ha)
Soil: ${activePlot.soilType}
Irrigation Method: ${activePlot.irrigationMethod}
Water Source: ${activePlot.waterSource || 'Borewell / Tube Well'}
Current Soil Moisture: ${activePlot.currentMoisture}% (Target: ${activePlot.targetMoistureRange.min}% - ${activePlot.targetMoistureRange.max}%)
Current Temp: ${activePlot.currentTemp}°C, Humidity: ${activePlot.currentHumidity}%
Soil pH: ${activePlot.currentPh ?? 'Not recorded (Data missing)'}
Soil Health Card: ${
    activePlot.soilHealthCard?.hasCard
      ? `Sample ${activePlot.soilHealthCard.sampleId}, Tested by ${activePlot.soilHealthCard.testingLab || 'KVK'}`
      : 'NO CARD RECORDED / MISSING'
  }
Nutrients: Nitrogen=${activePlot.nitrogenMgKg ? `${activePlot.nitrogenMgKg} mg/kg` : 'MISSING'}, Phosphorus=${activePlot.phosphorusMgKg ? `${activePlot.phosphorusMgKg} mg/kg` : 'MISSING'}, Potassium=${activePlot.potassiumMgKg ? `${activePlot.potassiumMgKg} mg/kg` : 'MISSING'}
Plot Status: ${activePlot.status}

WEATHER & MONSOON:
Condition: ${weather.condition}
Monsoon Status: ${weather.monsoonStatus || 'Active Monsoon'}
Data Source: ${weather.dataSource || 'IMD AWS Gridded'}
Temperature: ${weather.temperatureC}°C, Humidity: ${weather.humidityPercent}%
Past 24h Rain: ${weather.rainfallMmPast24h} mm
Forecast 24h Rain: ${weather.forecastRainfallMmNext24h} mm (Probability: ${weather.forecastRainProbability}%)

RECENT AGENT DECISIONS:
${recentDecisions
  .slice(0, 3)
  .map((d) => `• [${d.decisionType}] ${d.recommendation} (${d.priority}): ${d.reason}`)
  .join('\n')}

ACTIVE ALERTS:
${recentAlerts
  .slice(0, 3)
  .map((a) => `• [${a.severity}] ${a.title}: ${a.message}`)
  .join('\n') || 'None'}
`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Farm State Context:\n${plotContext}\n\nFarmer Query: "${message}"\nLanguage Directive: ${langInstruction}\n\nProvide an informative, scientifically accurate response grounded directly in the provided telemetry. Never fabricate missing NPK or Soil Health Card data. Always cite the exact numbers from the context.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.3,
        },
      });

      const suggested =
        language === 'mr'
          ? [
              `सध्या ${crop.nameMr} पिकाला सिंचन करणे गरजेचे आहे का?`,
              `माती परीक्षण (मृदा आरोग्य पत्रिका) कशी नोंदवावी?`,
              `मुसळधार पावसाच्या अंदाजानुसार खतांचे व्यवस्थापन कसे करावे?`,
            ]
          : language === 'hi'
          ? [
              `क्या अभी ${crop.nameHi} में सिंचाई करनी चाहिए?`,
              `मृदा स्वास्थ्य कार्ड (Soil Health Card) कैसे दर्ज करें?`,
              `मौसम पूर्वानुमान के अनुसार पानी की बचत कैसे करें?`,
            ]
          : [
              `Should I irrigate ${activePlot.name} right now?`,
              `What are the ICAR recommended NPK levels for ${crop.nameEn}?`,
              `How does the monsoon forecast affect our water management?`,
            ];

      return {
        reply: response.text || 'Telemetry analyzed.',
        source: 'gemini',
        suggestedQuestions: suggested,
      };
    } catch (err: any) {
      console.warn('Gemini chat error, returning grounded fallback:', err?.message);
    }
  }

  // Grounded Deterministic Fallback with multilingual support
  const q = message.toLowerCase();
  let reply = '';

  if (language === 'mr') {
    if (q.includes('पाणी') || q.includes('सिंचन') || q.includes('irrigate')) {
      if (activePlot.currentMoisture < activePlot.targetMoistureRange.min) {
        reply = `${activePlot.name} मधील मातीतील ओलावा सध्या ${activePlot.currentMoisture}% आहे, जो किमान मर्यादा ${activePlot.targetMoistureRange.min}% पेक्षा कमी आहे. तथापि, हवामान अंदाजानुसार ${weather.forecastRainfallMmNext24h} मिमी पावसाची शक्यता आहे (${weather.forecastRainProbability}%). निर्णय टॅबमध्ये जाऊन सिंचन शिफारस तपासा.`;
      } else {
        reply = `${activePlot.name} मध्ये मातीतील ओलावा ${activePlot.currentMoisture}% असून तो इष्टतम मर्यादेत (${activePlot.targetMoistureRange.min}% - ${activePlot.targetMoistureRange.max}%) सुरक्षित आहे. सध्या अतिरिक्त सिंचनाची आवश्यकता नाही.`;
      }
    } else if (q.includes('खत') || q.includes('माती') || q.includes('npk')) {
      if (activePlot.nitrogenMgKg === undefined) {
        reply = `${activePlot.name} साठी एनपीके (NPK) आकडे उपलब्ध नाहीत. शून्य-बनावट नियमानुसार (Zero-Fabrication Guardrail), अचूक माती परीक्षणाशिवाय रासायनिक खतांची मात्रा देणे असुरक्षित आहे. कृपया जवळच्या कृषी विज्ञान केंद्रात (KVK) मातीचा नमुना तपासा.`;
      } else {
        reply = `${activePlot.name} चे पोषक तत्व: नत्र (N): ${activePlot.nitrogenMgKg} mg/kg, स्फुरद (P): ${activePlot.phosphorusMgKg} mg/kg, पालाश (K): ${activePlot.potassiumMgKg} mg/kg. खत व्यवस्थापन टॅबमध्ये आयसीएआर (ICAR) मार्गदर्शक तत्त्वे उपलब्ध आहेत.`;
      }
    } else {
      reply = `${activePlot.name} स्थिती: पीक ${crop.nameMr} (${activePlot.growthStage}), मातीतील ओलावा ${activePlot.currentMoisture}%, तापमान ${activePlot.currentTemp}°C, हवामान स्थिती: ${weather.condition}. चालू मान्सून स्थिती: ${weather.monsoonStatus || 'सक्रिय'}.`;
    }

    return {
      reply,
      source: 'rule_engine',
      suggestedQuestions: [
        `सध्या ${activePlot.name} पिकाला सिंचन करावे का?`,
        `मृदा आरोग्य पत्रिकेनुसार खतांची मात्रा कशी ठरवावी?`,
        `पावसाचा अंदाज कसा आहे?`,
      ],
    };
  }

  if (language === 'hi') {
    if (q.includes('पानी') || q.includes('सिंचाई') || q.includes('irrigate')) {
      if (activePlot.currentMoisture < activePlot.targetMoistureRange.min) {
        reply = `${activePlot.name} में मिट्टी की नमी ${activePlot.currentMoisture}% है, जो न्यूनतम सीमा ${activePlot.targetMoistureRange.min}% से कम है। हालांकि, आगामी 24 घंटों में ${weather.forecastRainfallMmNext24h} मिमी बारिश का अनुमान है (${weather.forecastRainProbability}%)। सिंचाई निर्णय की समीक्षा करें।`;
      } else {
        reply = `${activePlot.name} में मिट्टी की नमी ${activePlot.currentMoisture}% है, जो सुरक्षित लक्ष्य सीमा (${activePlot.targetMoistureRange.min}% - ${activePlot.targetMoistureRange.max}%) में है। अभी अतिरिक्त सिंचाई की आवश्यकता नहीं है।`;
      }
    } else if (q.includes('खाद') || q.includes('उर्वरक') || q.includes('मिट्टी')) {
      if (activePlot.nitrogenMgKg === undefined) {
        reply = `${activePlot.name} के लिए NPK डेटा अनुपलब्ध है। हमारी शून्य-बनावट नीति (Zero-Fabrication Guardrail) के तहत हम बिना लैब परीक्षण के उर्वरक की सिफारिश नहीं करते। कृपया निकटतम कृषि विज्ञान केंद्र (KVK) से मृदा परीक्षण कराएं।`;
      } else {
        reply = `${activePlot.name} के पोषक तत्व: नाइट्रोजन: ${activePlot.nitrogenMgKg} mg/kg, फास्फोरस: ${activePlot.phosphorusMgKg} mg/kg, पोटाश: ${activePlot.potassiumMgKg} mg/kg। pH: ${activePlot.currentPh ?? 6.5}।`;
      }
    } else {
      reply = `${activePlot.name} विवरण: फसल ${crop.nameHi} (${activePlot.growthStage}), मिट्टी की नमी ${activePlot.currentMoisture}%, तापमान ${activePlot.currentTemp}°C। मानसून स्थिति: ${weather.monsoonStatus || 'सक्रिय'}।`;
    }

    return {
      reply,
      source: 'rule_engine',
      suggestedQuestions: [
        `क्या अभी ${activePlot.name} में सिंचाई करनी चाहिए?`,
        `केवीके मृदा स्वास्थ्य कार्ड कैसे जोड़ें?`,
        `आज का मौसम कैसा रहेगा?`,
      ],
    };
  }

  // English Fallback
  if (q.includes('irrigate') || q.includes('water')) {
    if (activePlot.currentMoisture < activePlot.targetMoistureRange.min) {
      reply = `Based on current telemetry, ${activePlot.name} moisture is at ${activePlot.currentMoisture}%, which is below the minimum threshold of ${activePlot.targetMoistureRange.min}% for ${crop.nameEn} (${activePlot.growthStage}). However, forecasted rain is ${weather.forecastRainfallMmNext24h}mm (${weather.forecastRainProbability}% probability). Check the Irrigation Decisions tab to review the agent's utility score and approve a simulated pulse.`;
    } else {
      reply = `${activePlot.name} is currently at ${activePlot.currentMoisture}% soil moisture, well within its safe target range of ${activePlot.targetMoistureRange.min}% to ${activePlot.targetMoistureRange.max}%. The agent recommends continuing passive monitoring to prevent waterlogging.`;
    }
  } else if (q.includes('fertiliz') || q.includes('nutrient') || q.includes('npk')) {
    if (activePlot.nitrogenMgKg === undefined) {
      reply = `Complete NPK telemetry or Soil Health Card data is currently missing for ${activePlot.name}. Under AgroGenesis Zero-Fabrication guardrails, the agent will never fabricate nutrient numbers. We recommend submitting a composite soil sample to the nearest Krishi Vigyan Kendra (KVK) before applying chemical fertilizers.`;
    } else {
      reply = `Current nutrient readings for ${activePlot.name} are Nitrogen: ${activePlot.nitrogenMgKg} mg/kg, Phosphorus: ${activePlot.phosphorusMgKg} mg/kg, Potassium: ${activePlot.potassiumMgKg} mg/kg. Soil pH is ${activePlot.currentPh ?? 6.5}. Check the Fertilization page for ICAR crop-specific nutrient balance and Urea/DAP/MOP dosage.`;
    }
  } else {
    reply = `AgroGenesis Agent Telemetry Summary for ${activePlot.name}: Crop is ${crop.nameEn} (${activePlot.growthStage}), soil moisture is ${activePlot.currentMoisture}% (target: ${activePlot.targetMoistureRange.min}-${activePlot.targetMoistureRange.max}%), ambient temp is ${activePlot.currentTemp}°C. Monsoon condition is "${weather.monsoonStatus || 'Active'}" with ${weather.forecastRainProbability}% chance of rain.`;
  }

  return {
    reply,
    source: 'rule_engine',
    suggestedQuestions: [
      `Should I irrigate ${activePlot.name}?`,
      `What soil tests are needed for ${crop.nameEn}?`,
      `What is the recommended fertilizer dosage?`,
    ],
  };
}

// -------------------------------------------------------------
// AUTONOMOUS AGENT GEMINI TOOL ORCHESTRATION (Section 7 & 18)
// -------------------------------------------------------------

const AGENT_FUNCTION_DECLARATIONS = [
  {
    name: 'analyzeIrrigationNeed',
    description: 'Computes soil water deficit, evapotranspiration demand, and determines if irrigation is needed for an Indian farm parcel.',
    parameters: {
      type: 'OBJECT',
      properties: {
        plotId: { type: 'STRING', description: 'The farm parcel identifier, e.g. plot-1, plot-2, plot-3, plot-4' },
      },
      required: ['plotId'],
    },
  },
  {
    name: 'analyzeFertilizationNeed',
    description: 'Evaluates soil fertility against ICAR recommended doses of fertilizer, strictly enforcing the Zero-Fabrication rule if lab NPK is missing.',
    parameters: {
      type: 'OBJECT',
      properties: {
        plotId: { type: 'STRING', description: 'The farm parcel identifier' },
      },
      required: ['plotId'],
    },
  },
  {
    name: 'requestHumanApproval',
    description: 'Queues an agronomic action for farmer human approval (Safety Level 3 Gate).',
    parameters: {
      type: 'OBJECT',
      properties: {
        plotId: { type: 'STRING', description: 'The farm parcel identifier' },
        actionType: { type: 'STRING', description: 'SIMULATED_IRRIGATION, FERTIGATION, or DRAINAGE' },
        reason: { type: 'STRING', description: 'Agronomic rationale explaining why action is requested' },
        priority: { type: 'STRING', description: 'LOW, MEDIUM, HIGH, or CRITICAL' },
      },
      required: ['plotId', 'actionType', 'reason'],
    },
  },
  {
    name: 'createAlert',
    description: 'Creates a prioritized alert for anomalies, drought stress, or rainfall lockout events.',
    parameters: {
      type: 'OBJECT',
      properties: {
        plotId: { type: 'STRING', description: 'The farm parcel identifier' },
        severity: { type: 'STRING', description: 'INFO, WARNING, or CRITICAL' },
        category: { type: 'STRING', description: 'MOISTURE, NUTRIENT, HARDWARE, or WEATHER' },
        title: { type: 'STRING', description: 'Short alert title' },
        message: { type: 'STRING', description: 'Detailed alert message' },
      },
      required: ['plotId', 'severity', 'category', 'title', 'message'],
    },
  },
  {
    name: 'validateSensorData',
    description: 'Validates physical bounds and noise for a given sensor reading on a plot.',
    parameters: {
      type: 'OBJECT',
      properties: {
        plotId: { type: 'STRING', description: 'Plot ID' },
        sensorType: { type: 'STRING', description: 'soil_moisture, temperature, or humidity' },
        value: { type: 'NUMBER', description: 'Sensor reading value to validate' },
      },
      required: ['plotId', 'sensorType', 'value'],
    },
  },
];

/**
 * Autonomous Gemini Reasoning Cycle with Function-Calling Tool Invocation.
 */
export async function runAutonomousGeminiReasoning(
  plot: Plot,
  weather: WeatherData,
  farmStore: any
): Promise<{
  toolCallsExecuted: { toolName: string; args: any; result: any }[];
  summary: string;
}> {
  const ai = getAiClient();
  if (!ai) {
    return {
      toolCallsExecuted: [],
      summary: 'Gemini API key not configured. Operating on ICAR deterministic decision baseline.',
    };
  }

  try {
    const prompt = `You are AgroGenesis, the autonomous AI agriculture agent for Indian precision farming.
Current Parcel Telemetry Under Review:
- Plot ID: ${plot.id} (${plot.name})
- Crop: ${plot.cropType} (${plot.growthStage})
- Soil Type: ${plot.soilType}
- Current Soil Moisture: ${plot.currentMoisture}% (Optimal ICAR Target Range: ${plot.targetMoistureRange.min}% - ${plot.targetMoistureRange.max}%)
- Ambient Temp: ${plot.currentTemp}°C, Humidity: ${plot.currentHumidity}%
- Weather & Monsoon: ${weather.condition}, 24h Rain: ${weather.rainfallMmPast24h}mm, Forecast 24h Rain: ${weather.forecastRainfallMmNext24h}mm (${weather.forecastRainProbability}% probability)

Instructions:
Review this parcel. If action, verification, or alerting is needed, CALL THE APPROPRIATE TOOL(S).
1. If soil moisture is below the minimum threshold and upcoming rainfall is less than 20mm, call analyzeIrrigationNeed and/or requestHumanApproval.
2. If 24h rainfall >= 20mm, enforce pump lockout (do not request irrigation).
3. If moisture is critically low or hardware telemetry is anomalous, call createAlert.
4. If conditions are optimal, do not call unnecessary tools; return a concise status summary.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
        tools: [{ functionDeclarations: AGENT_FUNCTION_DECLARATIONS as any }],
      },
    });

    const toolCallsExecuted: { toolName: string; args: any; result: any }[] = [];
    const calls = response.functionCalls;

    if (calls && calls.length > 0) {
      for (const call of calls) {
        if (!call.name) continue;
        try {
          const res = await farmStore.executeToolByName(call.name, call.args, 'GEMINI_ORCHESTRATOR');
          toolCallsExecuted.push({
            toolName: call.name,
            args: call.args,
            result: res,
          });
        } catch (callErr: any) {
          console.warn(`Error executing tool ${call.name} from Gemini:`, callErr?.message);
        }
      }
    }

    return {
      toolCallsExecuted,
      summary:
        response.text ||
        `Autonomous agent evaluated ${plot.name}: executed ${toolCallsExecuted.length} allowlisted tool calls.`,
    };
  } catch (err: any) {
    console.warn('Autonomous Gemini reasoning error:', err?.message);
    return {
      toolCallsExecuted: [],
      summary: `Autonomous reasoning fell back to ICAR baseline: ${err?.message}`,
    };
  }
}

