import { GoogleGenAI } from '@google/genai';
import {
  Plot,
  WeatherData,
  FarmAlert,
  AgentDecision,
  ConversationalChatResponse,
  SupportedLanguage,
  FarmAction,
} from '../src/types';
import { FarmStore } from './farmStore';
import { classifyUserIntent, ALLOWED_INTENTS } from './intentClassifier';
import { INDIAN_CROP_DATABASE } from '../src/data/indianAgriData';

export interface ChatHistoryEntry {
  role: 'user' | 'assistant' | 'agent';
  content: string;
}

export interface ConversationalRequestContext {
  message: string;
  plotId?: string;
  language: SupportedLanguage;
  history?: ChatHistoryEntry[];
  sessionContext?: {
    plotId?: string;
    crop?: string;
    growthStage?: string;
    location?: string;
  };
}

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

// -------------------------------------------------------------
// SPECIALIZED RULE-ENGINE DECISION EVALUATORS (Section 6)
// -------------------------------------------------------------

function evaluateAgentInfo(message: string, language: SupportedLanguage): { reply: string; suggestedQuestions: string[] } {
  const q = message.toLowerCase();

  // Check for simulation vs real sensor data question
  if (q.includes('simulation and real') || q.includes('simulation vs real') || q.includes('real sensor data')) {
    if (language === 'hi') {
      return {
        reply:
          'एग्रोजेनेसिस (AgroGenesis) में वास्तविक सेंसर डेटा और सिमुलेशन में मुख्य अंतर:\n\n1. वास्तविक सेंसर (Real Sensors): खेत में लगे फिजिकल कैपेसिटिव नमी सेंसर, तापमान प्रोब और IoT गेटवे से हार्डवेयर बस (Modbus/RS485/LoRa) के माध्यम से लाइव टेलीमेट्री प्राप्त होती है।\n2. सिमुलेशन इंजन (Simulation Engine): यह ICAR और Penman-Monteith वाष्पोत्सर्जन (ET0) भौतिकी मॉडल का उपयोग करके मिट्टी में पानी के अवशोषण, वर्षा और तापमान में उतार-चढ़ाव का सटीक आभासी अनुकरण करता है।\n3. सुरक्षा गेट (Safety Guardrail): सिमुलेशन से किसान बिना फसल नुकसान या पानी की बर्बादी के जोखिम के विभिन्न सूखे व भारी वर्षा के परिदृश्यों का सुरक्षित परीक्षण कर सकते हैं।',
        suggestedQuestions: [
          'एजेंट आर्किटेक्चर कैसे काम करता है?',
          'खेत की वर्तमान स्थिति क्या है?',
          'क्या अभी सिंचाई करनी चाहिए?',
        ],
      };
    }
    if (language === 'mr') {
      return {
        reply:
          'अ‍ॅग्रोजेनेसिसमध्ये प्रत्यक्ष सेन्सर डेटा आणि सिम्युलेशनमधील फरक:\n\n१. प्रत्यक्ष सेन्सर (Real Sensor Data): शेतामध्ये बसवलेले कॅपेसिटिव्ह सेन्सर, वेदर स्टेशन व आयओटी उपकरणांद्वारे रिअल-टाइम डेटा नोंदवला जातो.\n२. सिम्युलेशन इंजिन (Simulation Model): आयसीएआर (ICAR) निकष, मातीची जलधारण क्षमता व मान्सून पर्जन्यमानाचा वापर करून अचूक आभासी वातावरण तयार करते.\n३. सुरक्षितता (Safety): सिम्युलेशनच्या मदतीने शेतकरी प्रत्यक्ष पाणी किंवा विजेचा अपव्यय न करता वेगवेगळ्या हवामान परिस्थितींचे विश्लेषण करू शकतात.',
        suggestedQuestions: [
          'एआय एजंटची भूमिका काय आहे?',
          'शेतातील मातीतील ओलावा किती आहे?',
          'सिंचन शिफारस कशी तपासावी?',
        ],
      };
    }
    return {
      reply:
        'Difference Between Real Sensor Telemetry and Simulation in AgroGenesis:\n\n1. Real Sensor Telemetry: Represents physical in-situ IoT probes (capacitive frequency domain reflectometry for soil moisture, digital temperature/humidity sensors) reporting over LoRaWAN or cellular telemetry. Readings are subject to sensor degradation, calibration drift, and signal noise.\n2. Simulation Engine: Driven by agronomic physics models (ICAR Crop Water Balance, FAO-56 Penman-Monteith Evapotranspiration), continuously simulating dynamic soil percolation, root extraction, and IMD monsoon precipitation.\n3. Safety Sandbox: Allows agronomists and farmers to stress-test critical drought scenarios, power feeder outages, and heavy rainfall lockouts in a safe digital twin before executing physical actuators.',
      suggestedQuestions: [
        'What is your role as an agriculture AI agent?',
        'What is the current condition of my farm?',
        'How does your agent work?',
      ],
    };
  }

  // Specific: "How does your agent work?" / Agent cognitive architecture
  if (
    q.includes('how does your agent work') ||
    q.includes('how do you work') ||
    q.includes('how does it work') ||
    q.includes('architecture') ||
    q.includes('cognitive loop') ||
    q.includes('कार्यप्रणाली') ||
    q.includes('कसे कार्य करतो')
  ) {
    if (language === 'hi') {
      return {
        reply:
          'एग्रोजेनेसिस (AgroGenesis) एजेंट का स्वायत्त कार्य-चक्र (Cognitive Architecture):\n\n1. प्रत्यक्ष ज्ञान (Perception): हर चक्र में मिट्टी के सेंसर (Moisture, Temp) और IMD वर्षा पूर्वानुमान एकत्र किए जाते हैं और सीमा-जाँच द्वारा सत्यापित होते हैं।\n2. त्रिपक्षीय स्मृति (Memory): अल्पकालिक (ताजा रीडिंग), प्रासंगिक (पिछले सिंचाई निर्णय व प्रभाव), और शब्दार्थ स्मृति (ICAR फसल मॉडल) बनाए रखी जाती है।\n3. उपयोगिता तर्क (Reasoning Engine): पानी की कमी, वाष्पोत्सर्जन (ET0) और वर्षा जोखिम का गणितीय विश्लेषण कर सर्वोत्तम निर्णय निकाला जाता है।\n4. सुरक्षा गेट (Level 3 Gate): मानव-स्वीकृति के बिना कोई स्वचालित सिंचाई पंप शुरू नहीं होता।\n5. प्रतिक्रिया लूप (Closed Loop): पानी देने के बाद मिट्टी की नमी में हुए बदलाव का अध्ययन कर भविष्य के निर्णयों को परिष्कृत किया जाता है।',
        suggestedQuestions: [
          'खेत की वर्तमान स्थिति क्या है?',
          'क्या अभी सिंचाई करनी चाहिए?',
          'सेंसर बंद हो जाए तो क्या होगा?',
        ],
      };
    }
    if (language === 'mr') {
      return {
        reply:
          'अ‍ॅग्रोजेनेसिस एआय एजंटची कार्यपद्धती (Cognitive Architecture):\n\n१. सेन्सर निरीक्षण (Perception): शेतातील ओलावा आणि IMD हवामान अंदाजाचे अखंड संकलन व पडताळणी.\n२. त्रस्तरीय स्मृती (Memory): शॉर्ट-टर्म (चालू वाचन), एपिसोडिक (मागील निर्णय) आणि सिमेंटिक (ICAR पीक निकष).\n३. निर्णय प्रक्रिया (Reasoning Engine): पावसाची शक्यता आणि पिकाच्या गरजेनुसार पाण्याचे अचूक गणित मांडणे.\n४. शेतकरी सुरक्षा (Level 3 Safety): शेतकरी ऑपरेटरच्या थेट मान्यतेशिवाय सिंचन प्रत्यक्ष सुरू होत नाही.\n५. सातत्यपूर्ण सुधारणा (Feedback Loop): सिंचनानंतर मातीतील बदलांचे मूल्यमापन करून अचूकता वाढवली जाते.',
        suggestedQuestions: [
          'शेतातील मातीतील ओलावा किती आहे?',
          'मागील सिंचन कृती कोणती होती?',
          'एआय एजंटची भूमिका काय आहे?',
        ],
      };
    }
    return {
      reply:
        'How the AgroGenesis Autonomous Agent Operates (The 5-Stage Cognitive Loop):\n\n1. Perception & Verification: Every 30 seconds, the agent ingests raw sensor telemetry (soil moisture, temperature, humidity) and runs range & flatline anomaly checks against physical bounds.\n2. Tripartite Memory Integration: The state is indexed across Short-Term Perception Cache, Episodic Decision History, and Persistent Semantic Memory (ICAR crop coefficients & Soil Health Cards).\n3. Agronomic Utility Reasoning: An agricultural world model computes phenological crop water deficits and evaluates utility tradeoffs (e.g. postponing pumping if IMD forecasts >15mm rain).\n4. Safety-Level Human Gateway: Recommendations are subjected to Level 3 Human-in-the-Loop constraints—no physical or simulated actuator is triggered without explicit operator signoff.\n5. Closed-Loop Telemetry Auditing: Following any irrigation event, the agent monitors hydrological recovery curves to calibrate soil water retention parameters.',
      suggestedQuestions: [
        'What is your role as an agriculture AI agent?',
        'What is the current condition of my farm?',
        'What happens if my soil sensor stops working?',
      ],
    };
  }

  // General Role / What is your role
  if (language === 'hi') {
    return {
      reply:
        'कृषि एआई एजेंट के रूप में मेरी भूमिका (AgroGenesis Role & Responsibilities):\n\n1. स्वायत्त फसल निर्णय सहायता: भारतीय किसानों को सही समय पर सिंचाई और सटीक पोषक तत्व प्रबंधन में मदद करना।\n2. प्राकृतिक संसाधनों का संरक्षण: मान्सून वर्षा के दौरान भूजल दोहन और बिजली की बर्बादी को रोकना।\n3. जोखिम निवारण: अत्यधिक नमी, जलभराव, सूखे का तनाव और सेंसर खराब होने की स्थिति में तत्काल चेतावनी देना।\n4. भरोसेमंद व सुरक्षित सलाह: बिना प्रयोगशाला परीक्षण (KVK Soil Health Card) के कभी भी मनगढ़ंत रासायनिक उर्वरक नहीं बताना।',
      suggestedQuestions: [
        'How does your agent work?',
        'मेरे खेत की वर्तमान स्थिति क्या है?',
        'क्या धान की फसल में अभी पानी देना चाहिए?',
      ],
    };
  }

  if (language === 'mr') {
    return {
      reply:
        'कृषी एआय एजंट म्हणून माझी प्रमुख भूमिका (AgroGenesis Core Role):\n\n१. शेती व्यवस्थापन सहकार्य: अचूक सिंचन आणि पिकांच्या गरजेनुसार पाण्याचे सुयोग्य नियोजन.\n२. भूजल व ऊर्जा संवर्धन: पाऊस पडणार असल्यास पंपिंग थांबवून पाणी आणि विजेची बचत करणे.\n३. जोखीम व्यवस्थापन: अवकाळी पाऊस, दुष्काळ आणि सेन्सर दोषांपासून पिकांचे रक्षण करणे.\n४. अचूकता व सत्यता: कोणत्याही काल्पनिक शिफारशी न करता अधिकृत ICAR आणि KVK मानकांवर आधारित माहिती देणे.',
      suggestedQuestions: [
        'How does your agent work?',
        'माझ्या शेताची सद्यस्थिती काय आहे?',
        'मातीतील ओलावा किती आहे?',
      ],
    };
  }

  return {
    reply:
      'My Role as an Agricultural AI Agent:\n\n1. Precision Decision Support: To serve as an autonomous agronomic copilot for Indian farmers, optimizing crop yield and soil health based on real-time field conditions.\n2. Resource Conservation: Automatically conserving groundwater and power feeder electricity by implementing smart rainfall lockouts during active monsoon seasons.\n3. Continuous Farm Protection: Providing 24/7 autonomous monitoring for soil moisture stress, waterlogging risks, and hardware sensor telemetry faults.\n4. Zero-Fabrication Safety: Ensuring that agricultural recommendations adhere strictly to ICAR benchmarks, requiring verified Soil Health Cards before prescribing fertilizer applications.',
    suggestedQuestions: [
      'How does your agent work?',
      'What is the current condition of my farm?',
      'Should I irrigate my rice crop?',
    ],
  };
}

function evaluateFarmStatus(
  farmStore: FarmStore,
  activePlot: Plot,
  weather: WeatherData,
  language: SupportedLanguage,
  userMessage?: string
): { reply: string; suggestedQuestions: string[] } {
  const farm = farmStore.farm;
  const activeAlerts = farmStore.alerts.filter((a) => a.status === 'ACTIVE');
  const crop = INDIAN_CROP_DATABASE[activePlot.cropType] || { nameEn: activePlot.cropType, nameHi: activePlot.cropType, nameMr: activePlot.cropType };
  const rainForecastMm = weather.forecastRainfallMmNext24h || 0;
  const isMoistureLow = activePlot.currentMoisture < activePlot.targetMoistureRange.min;
  const isMoistureHigh = activePlot.currentMoisture > activePlot.targetMoistureRange.max;

  // Single Most Important Agronomic Action calculation
  let actionEn = '';
  let actionHi = '';
  let actionMr = '';

  if (rainForecastMm >= 15) {
    actionEn = `HOLD IRRIGATION & PREPARE DRAINAGE: Substantial rainfall (~${rainForecastMm} mm) is forecast within 24 hours (${weather.forecastRainProbability}% probability). Maintain the autonomous pump lockout to prevent waterlogging and conserve electricity, while inspecting terrace bunds to ensure excess surface runoff can drain freely.`;
    actionHi = `सिंचाई रोकें एवं जल निकासी तैयार रखें: आगामी 24 घंटों में लगभग ${rainForecastMm} मिमी वर्षा का अनुमान है (${weather.forecastRainProbability}% संभावना)। सर्वाधिक महत्वपूर्ण कार्रवाई यह है कि पंप बंद रखें (जलभराव से बचने व बिजली बचाने हेतु) और खेत के बंधों पर जल निकासी मार्ग साफ रखें।`;
    actionMr = `सिंचन थांबवा व पाण्याचा निचरा तपासा: पुढील २४ तासांत सुमारे ${rainForecastMm} मिमी पावसाचा अंदाज आहे (${weather.forecastRainProbability}% शक्यता). प्राथमिक कृती म्हणजे पाण्याचा अपव्यय व पाणी साचणे टाळण्यासाठी पंप बंद ठेवणे आणि शेतातील पाण्याचा निचरा योग्य असल्याची खात्री करणे.`;
  } else if (isMoistureLow) {
    actionEn = `SCHEDULE CALIBRATED IRRIGATION: Soil moisture (${activePlot.currentMoisture.toFixed(1)}%) has dipped below the critical minimum threshold of ${activePlot.targetMoistureRange.min}%. Schedule a calibrated drip irrigation pulse during early morning hours to restore root-zone hydration.`;
    actionHi = `सटीक सिंचाई की योजना बनाएं: मिट्टी की नमी (${activePlot.currentMoisture.toFixed(1)}%) न्यूनतम सीमा ${activePlot.targetMoistureRange.min}% से कम है। सबसे जरूरी कार्रवाई सुबह के समय ड्रिप सिंचाई चलाकर पौधों में जल संतुलन बहाल करना है।`;
    actionMr = `नियोजित सिंचन करा: मातीतील ओलावा (${activePlot.currentMoisture.toFixed(1)}%) किमान मर्यादेपेक्षा (${activePlot.targetMoistureRange.min}%) कमी आहे. मुळांना पाण्याचा ताण पडू नये म्हणून सकाळच्या वेळी ठिबक सिंचन सुरू करणे ही सर्वात महत्त्वाची कृती आहे.`;
  } else if (isMoistureHigh) {
    actionEn = `DEFER WATERING & AVOID ROOT ASPHYXIATION: Soil moisture (${activePlot.currentMoisture.toFixed(1)}%) exceeds the upper safe threshold of ${activePlot.targetMoistureRange.max}%. Defer all watering and verify drainage sluices to ensure root oxygenation.`;
    actionHi = `पानी देना टालें एवं जड़ गलन से बचाव करें: मिट्टी की नमी (${activePlot.currentMoisture.toFixed(1)}%) अधिकतम सीमा ${activePlot.targetMoistureRange.max}% से अधिक है। मुख्य कार्रवाई किसी भी प्रकार की सिंचाई टालना और वायु संचार बनाए रखना है।`;
    actionMr = `पाणी देणे टाळा व हवा खेळती ठेवा: मातीतील ओलावा (${activePlot.currentMoisture.toFixed(1)}%) कमाल मर्यादेपेक्षा (${activePlot.targetMoistureRange.max}%) जास्त आहे. अतिरिक्त पाण्यामुळे मुळे कुजण्याचा धोका टाळण्यासाठी सिंचन बंद ठेवावे.`;
  } else {
    actionEn = `MAINTAIN CURRENT IRRIGATION LOCKOUT & MONITOR CANOPY: Soil moisture is optimal at ${activePlot.currentMoisture.toFixed(1)}% (safe band: ${activePlot.targetMoistureRange.min}%–${activePlot.targetMoistureRange.max}%). Maintain the current irrigation lockout, while scouting the canopy for foliar disease risk given elevated relative humidity (${activePlot.currentHumidity}%).`;
    actionHi = `वर्तमान सिंचाई लॉकआउट बनाए रखें एवं फसल की निगरानी करें: मिट्टी की नमी ${activePlot.currentMoisture.toFixed(1)}% पर पूरी तरह अनुकूल है। सबसे महत्वपूर्ण कार्रवाई यह है कि अभी अतिरिक्त पानी न दें और उच्च आर्द्रता (${activePlot.currentHumidity}%) के कारण पत्तियों पर फंगल रोगों की निगरानी रखें।`;
    actionMr = `सध्या सिंचन लॉकआउट सुरू ठेवा व पिकाची पाहणी करा: मातीतील ओलावा ${activePlot.currentMoisture.toFixed(1)}% वर सुरक्षित मर्यादेत आहे. सर्वात महत्त्वाची कृती म्हणजे अतिरिक्त पाणी न देणे आणि हवेतील आर्द्रतेमुळे (${activePlot.currentHumidity}%) पानावरील करपा रोगाची तपासणी करणे.`;
  }

  if (language === 'hi') {
    return {
      reply: `खेत की वर्तमान स्थिति का विश्लेषण एवं सर्वाधिक महत्वपूर्ण कार्रवाई:\n\n` +
        `१. खेत व भूखंड स्थिति:\n` +
        `• खेत: "${farm.name}" (${farm.talukaOrVillage}, ${farm.district}, ${farm.state})\n` +
        `• सक्रिय भूखंड: ${activePlot.name} — फसल: ${crop.nameHi} (${activePlot.growthStage})\n` +
        `• मिट्टी का प्रकार: ${activePlot.soilType}\n\n` +
        `२. वर्तमान सेंसर व मौसम टेलीमेट्री:\n` +
        `• मिट्टी की नमी: ${activePlot.currentMoisture.toFixed(1)}% (सुरक्षित सीमा: ${activePlot.targetMoistureRange.min}% - ${activePlot.targetMoistureRange.max}%)\n` +
        `• परिवेश तापमान: ${activePlot.currentTemp}°C, आर्द्रता: ${activePlot.currentHumidity}%\n` +
        `• मौसम व मान्सून: ${weather.condition}, 24h में वर्षा का पूर्वानुमान: ${weather.forecastRainfallMmNext24h} मिमी (${weather.forecastRainProbability}% संभावना)\n` +
        `• सक्रिय अलर्ट: ${activeAlerts.length} सक्रिय चेतावनी\n\n` +
        `३. सर्वाधिक महत्वपूर्ण अनुशंसित कार्रवाई (Single Most Important Action):\n` +
        `👉 ${actionHi}`,
      suggestedQuestions: [
        `क्या ${activePlot.name} में अभी सिंचाई करनी चाहिए?`,
        `वर्तमान मिट्टी की नमी का विश्लेषण करें`,
        `फसल स्वास्थ्य को प्रभावित करने वाले कारक क्या हैं?`,
      ],
    };
  }

  if (language === 'mr') {
    return {
      reply: `शेताची सद्यस्थिती आणि सर्वात महत्त्वाची शिफारस केलेली कृती:\n\n` +
        `१. शेत व विभागाचा आढावा:\n` +
        `• मॉडेल फार्म: "${farm.name}" (${farm.talukaOrVillage}, ${farm.district}, ${farm.state})\n` +
        `• निवडलेला विभाग: ${activePlot.name} — पीक: ${crop.nameMr} (${activePlot.growthStage})\n` +
        `• मातीचा प्रकार: ${activePlot.soilType}\n\n` +
        `२. सेन्सर व हवामान निरीक्षणे:\n` +
        `• मातीतील ओलावा: ${activePlot.currentMoisture.toFixed(1)}% (इष्टतम मर्यादा: ${activePlot.targetMoistureRange.min}% - ${activePlot.targetMoistureRange.max}%)\n` +
        `• तापमान: ${activePlot.currentTemp}°C, हवेतील आर्द्रता: ${activePlot.currentHumidity}%\n` +
        `• मान्सून स्थिती: ${weather.monsoonStatus || 'सक्रिय'}, पुढील २४ तासांत पाऊस: ${weather.forecastRainfallMmNext24h} मिमी (${weather.forecastRainProbability}% शक्यता)\n` +
        `• सक्रिय इशारे: ${activeAlerts.length}\n\n` +
        `३. सध्याची सर्वात महत्त्वाची कृती (Single Most Important Action):\n` +
        `👉 ${actionMr}`,
      suggestedQuestions: [
        `सध्या ${activePlot.name} मध्ये सिंचन करावे का?`,
        `मातीतील ओलावा सुरक्षित मर्यादेत आहे का?`,
        `पिकाच्या आरोग्यावर परिणाम करणारे घटक कोणते?`,
      ],
    };
  }

  return {
    reply: `Analysis of Current Farm Conditions & Primary Action Recommendation:\n\n` +
      `1. Farm & Parcel Overview:\n` +
      `• Holding: ${farm.name} located in ${farm.talukaOrVillage}, ${farm.district} District, ${farm.state}, India\n` +
      `• Active Parcel: ${activePlot.name} — Crop: ${crop.nameEn} (${activePlot.growthStage})\n` +
      `• Soil Texture: ${activePlot.soilType} with ${activePlot.irrigationMethod}\n\n` +
      `2. Environmental & In-Situ Sensor Telemetry:\n` +
      `• Soil Moisture: ${activePlot.currentMoisture.toFixed(1)}% (Safe Agronomic Band: ${activePlot.targetMoistureRange.min}% – ${activePlot.targetMoistureRange.max}%)\n` +
      `• Microclimate: Ambient Temperature ${activePlot.currentTemp}°C, Relative Humidity ${activePlot.currentHumidity}%\n` +
      `• Weather & Monsoon: ${weather.condition} (${weather.monsoonStatus || 'Active'}), Forecast 24h Rain: ${weather.forecastRainfallMmNext24h} mm (${weather.forecastRainProbability}% probability)\n` +
      `• Telemetry Quality: Probes operational, ${activeAlerts.length} active notifications\n\n` +
      `3. Single Most Important Action to Take Right Now:\n` +
      `👉 ${actionEn}`,
    suggestedQuestions: [
      `What factors are affecting the health of my crop right now?`,
      `Should I irrigate my ${activePlot.cropType} crop?`,
      `What is the weather at my farm?`,
    ],
  };
}

function evaluateSensorQuery(
  activePlot: Plot,
  message: string,
  language: SupportedLanguage
): { reply: string; suggestedQuestions: string[] } {
  const q = message.toLowerCase();

  // Hardware failure / stop working question
  if (q.includes('stop working') || q.includes('stops working') || q.includes('fail') || q.includes('broken') || q.includes('खराब')) {
    if (language === 'hi') {
      return {
        reply:
          `यदि ${activePlot.name} का मिट्टी नमी सेंसर काम करना बंद कर देता है:\n\n1. विसंगति पहचान (Anomaly Detection): एजेंट लगातार 3 साइकल तक फ्लैटलाइन या -999 मान देखकर 'HARDWARE_ANOMALY' अलर्ट जारी करता है।\n2. सुरक्षित डिग्रेडेड मोड (Fail-Safe Degraded Mode): एजेंट गलत या शून्य रीडिंग के आधार पर स्वचालित पंप शुरू नहीं करता (Safety Level 3 Lockout)।\n3. बैकअप गणना: एजेंट ऐतिहासिक वाष्पोत्सर्जन (ET0) और IMD वर्षा डेटा के आधार पर अनुमानित जल स्तर की रिपोर्ट करता है और किसान को सेंसर जांचने का नोटिस भेजता है।`,
        suggestedQuestions: [
          'वर्तमान मिट्टी की नमी कितनी है?',
          'क्या सेंसर रीडिंग सामान्य है?',
          'खेत की स्थिति दिखाएं',
        ],
      };
    }
    if (language === 'mr') {
      return {
        reply:
          `जर ${activePlot.name} मधील मातीचा सेन्सर खराब झाला तर:\n\n१. दोष ओळख (Fault Detection): एजंट अवास्तव वाचन (उदा. ०% किंवा १००% वर अडकणे) ओळखून 'SENSOR_ANOMALY' इशारा देतो.\n२. आपत्कालीन कुलूप (Safety Lockout): सेन्सर दुरुस्त होईपर्यंत किंवा मॅन्युअल तपासणी होईपर्यंत कोणताही स्वयंचलित पंप सुरू केला जात नाही.\n३. पर्यायी अंदाज: हवामान अंदाज व पिकाच्या दिवसांनुसार पाणी वापराचा अंदाजे अहवाल दिला जातो.`,
        suggestedQuestions: [
          'सध्या मातीतील ओलावा किती आहे?',
          'शेतातील सेन्सर योग्य रीतीने काम करत आहेत का?',
          'एआय एजंटची भूमिका काय आहे?',
        ],
      };
    }
    return {
      reply:
        `If your soil sensor stops working or produces anomalous readings on ${activePlot.name}:\n\n1. Sensor Health Telemetry Flagging: The agent's perception layer detects flatlining, out-of-bounds voltage, or missing packets and tags the reading as 'anomalous' or 'degraded'.\n2. Automatic Actuator Lockout: To prevent catastrophic over-watering or pump burnout, all autonomous actuation for this parcel is immediately locked out.\n3. Degraded Fail-Safe Fallback: The agent switches to a secondary hydrological model using historical FAO-56 evapotranspiration and IMD rainfall estimates, while issuing a high-priority alert for physical sensor probe inspection.`,
      suggestedQuestions: [
        'What is the current soil moisture?',
        'Are my sensors working properly?',
        'What is your role as an agriculture AI agent?',
      ],
    };
  }

  // Specific moisture reading inquiry
  if (language === 'hi') {
    return {
      reply: `${activePlot.name} में वर्तमान सिमुलेटेड मिट्टी की नमी ${activePlot.currentMoisture.toFixed(1)}% है। ${activePlot.cropType} (${activePlot.growthStage}) के लिए अनुशंसित सुरक्षित सीमा ${activePlot.targetMoistureRange.min}% से ${activePlot.targetMoistureRange.max}% है। सेंसर टेलीमेट्री सामान्य व सत्यापित है।`,
      suggestedQuestions: [
        `क्या ${activePlot.cropType} में अभी सिंचाई करनी चाहिए?`,
        `क्या सेंसर सामान्य रूप से काम कर रहा है?`,
        `मौसम का क्या हाल है?`,
      ],
    };
  }

  if (language === 'mr') {
    return {
      reply: `${activePlot.name} मधील सध्याचा सिमुलेटेड मातीतील ओलावा ${activePlot.currentMoisture.toFixed(1)}% आहे. ${activePlot.cropType} साठी इष्टतम सुरक्षित मर्यादा ${activePlot.targetMoistureRange.min}% ते ${activePlot.targetMoistureRange.max}% आहे. सेन्सर वाचन वैध व तपासलेले आहे.`,
      suggestedQuestions: [
        `सध्या पिकाला सिंचन करणे गरजेचे आहे का?`,
        `पावसाचा अंदाज काय आहे?`,
        `मातीतील पोषक घटकांची स्थिती काय आहे?`,
      ],
    };
  }

  return {
    reply: `The current simulated soil moisture for ${activePlot.name} is ${activePlot.currentMoisture.toFixed(1)}%. The configured safe target range for ${activePlot.cropType} (${activePlot.growthStage}) is ${activePlot.targetMoistureRange.min}% – ${activePlot.targetMoistureRange.max}%. The sensor status is valid, and ambient temperature is ${activePlot.currentTemp}°C with ${activePlot.currentHumidity}% relative humidity.`,
    suggestedQuestions: [
      `Should I irrigate my ${activePlot.cropType} crop?`,
      `What happens if my soil sensor stops working?`,
      `What is the weather at my farm?`,
    ],
  };
}

function evaluateIrrigationNeed(
  activePlot: Plot,
  weather: WeatherData,
  language: SupportedLanguage
): { reply: string; decision: any; suggestedQuestions: string[] } {
  const isBelow = activePlot.currentMoisture < activePlot.targetMoistureRange.min;
  const isRainImminent = (weather.forecastRainfallMmNext24h || 0) >= 15;
  const crop = INDIAN_CROP_DATABASE[activePlot.cropType] || { nameEn: activePlot.cropType, nameHi: activePlot.cropType, nameMr: activePlot.cropType };

  if (isRainImminent && isBelow) {
    const reasonEn = `Soil moisture (${activePlot.currentMoisture.toFixed(1)}%) is below the minimum threshold (${activePlot.targetMoistureRange.min}%), but IMD forecast predicts ${weather.forecastRainfallMmNext24h}mm rainfall (${weather.forecastRainProbability}% chance). Irrigation is DEFERRED to prevent surface runoff and tubewell electricity waste.`;
    return {
      reply:
        language === 'hi'
          ? `सिंचाई निर्णय: आस्थगित (DEFERRED)\n\nकारण: मिट्टी की नमी (${activePlot.currentMoisture.toFixed(1)}%) अनुशंसित सीमा (${activePlot.targetMoistureRange.min}%) से कम है, परंतु आगामी 24 घंटों में ${weather.forecastRainfallMmNext24h} मिमी वर्षा का अनुमान है (${weather.forecastRainProbability}%)। प्राकृतिक वर्षा का लाभ उठाने के लिए सिंचाई स्थगित रखी गई है।`
          : language === 'mr'
          ? `सिंचन निर्णय: पुढे ढकलण्यात आले (DEFERRED)\n\nकारण: मातीतील ओलावा (${activePlot.currentMoisture.toFixed(1)}%) किमान मर्यादेपेक्षा कमी आहे, पण पुढील २४ तासांत ${weather.forecastRainfallMmNext24h} मिमी पावसाचा अंदाज आहे. भूजल व विजेची बचत करण्यासाठी सिंचन थांबवले आहे.`
          : `Irrigation Decision: DEFERRED\n\nReason: While soil moisture (${activePlot.currentMoisture.toFixed(1)}%) is below the optimal threshold (${activePlot.targetMoistureRange.min}% for ${crop.nameEn}), the IMD forecast indicates ${weather.forecastRainfallMmNext24h} mm of rainfall within 24 hours (${weather.forecastRainProbability}% probability). The agent recommends deferring irrigation to utilize natural precipitation and prevent waterlogging.`,
      decision: {
        recommendation: 'DEFER_IRRIGATION_RAIN',
        priority: 'MEDIUM',
        confidence: 0.89,
        reason: reasonEn,
      },
      suggestedQuestions: [
        'What is the weather forecast at my farm?',
        'What is the current soil moisture?',
        'How does your agent work?',
      ],
    };
  }

  if (isBelow) {
    const reasonEn = `Soil moisture (${activePlot.currentMoisture.toFixed(1)}%) is below the critical threshold of ${activePlot.targetMoistureRange.min}% for ${crop.nameEn} during ${activePlot.growthStage}. With low rainfall forecast (${weather.forecastRainfallMmNext24h || 0}mm), a precision irrigation pulse is recommended, pending operator authorization.`;
    return {
      reply:
        language === 'hi'
          ? `सिंचाई निर्णय: अनुशंसित (RECOMMENDED)\n\nकारण: ${activePlot.name} में नमी ${activePlot.currentMoisture.toFixed(1)}% है, जो ${activePlot.targetMoistureRange.min}% के लक्ष्य से नीचे है। आगामी 24 घंटों में पर्याप्त वर्षा का अनुमान नहीं है। फसल तनाव से बचाव हेतु लगभग 20 मिनट के ड्रिप सिंचन का प्रस्ताव है (मानवीय स्वीकृति आवश्यक)।`
          : language === 'mr'
          ? `सिंचन निर्णय: शिफारस केली आहे (RECOMMENDED)\n\nकारण: ${activePlot.name} मधील ओलावा ${activePlot.currentMoisture.toFixed(1)}% असून तो ${activePlot.targetMoistureRange.min}% पेक्षा कमी आहे. पावसाची शक्यता कमी असल्याने पिकाचे नुकसान टाळण्यासाठी ठिबक सिंचन सुरू करण्याचा प्रस्ताव आहे.`
          : `Irrigation Decision: RECOMMENDED (Pending Human Approval)\n\nReason: Soil moisture on ${activePlot.name} is currently ${activePlot.currentMoisture.toFixed(1)}%, which is below the safe threshold of ${activePlot.targetMoistureRange.min}% for ${crop.nameEn} (${activePlot.growthStage}). With negligible forecast rain (${weather.forecastRainfallMmNext24h || 0} mm), the agent recommends queuing a 20-minute irrigation pulse under Safety Level 3.`,
      decision: {
        recommendation: 'RECOMMEND_IRRIGATION',
        priority: 'HIGH',
        confidence: 0.91,
        reason: reasonEn,
      },
      suggestedQuestions: [
        'Simulate irrigation on this plot',
        'What was my last irrigation action?',
        'What is the current soil moisture?',
      ],
    };
  }

  // Moisture optimal
  const reasonEn = `Soil moisture (${activePlot.currentMoisture.toFixed(1)}%) is well within the safe target range (${activePlot.targetMoistureRange.min}% - ${activePlot.targetMoistureRange.max}%). Passive monitoring continues.`;
  return {
    reply:
      language === 'hi'
        ? `सिंचाई निर्णय: निगरानी जारी रखें (CONTINUE MONITORING)\n\nकारण: ${activePlot.name} में मिट्टी की नमी वर्तमान में ${activePlot.currentMoisture.toFixed(1)}% है, जो ${crop.nameHi} के लिए सुरक्षित लक्ष्य सीमा (${activePlot.targetMoistureRange.min}% - ${activePlot.targetMoistureRange.max}%) में है। अभी अतिरिक्त सिंचाई की आवश्यकता नहीं है।`
        : language === 'mr'
        ? `सिंचन निर्णय: निरीक्षण सुरू ठेवा (CONTINUE MONITORING)\n\nकारण: ${activePlot.name} मध्ये मातीतील ओलावा सध्या ${activePlot.currentMoisture.toFixed(1)}% आहे, जो सुरक्षित मर्यादेत (${activePlot.targetMoistureRange.min}% ते ${activePlot.targetMoistureRange.max}%) आहे. आता पाणी देण्याची गरज नाही.`
        : `Irrigation Decision: CONTINUE MONITORING\n\nBased on current sensor readings, soil moisture for ${activePlot.name} is ${activePlot.currentMoisture.toFixed(1)}%, which sits comfortably within the safe target band of ${activePlot.targetMoistureRange.min}% – ${activePlot.targetMoistureRange.max}% for ${crop.nameEn} in the ${activePlot.growthStage} stage. Irrigation should not be initiated, as excess moisture could induce root asphyxiation.`,
    decision: {
      recommendation: 'CONTINUE_MONITORING',
      priority: 'LOW',
      confidence: 0.94,
      reason: reasonEn,
    },
    suggestedQuestions: [
      'What is the current condition of my farm?',
      'What is the weather at my farm?',
      'What is the NPK condition of my soil?',
    ],
  };
}

function evaluateFertilizationNeed(
  activePlot: Plot,
  language: SupportedLanguage
): { reply: string; suggestedQuestions: string[] } {
  const crop = INDIAN_CROP_DATABASE[activePlot.cropType] || { nameEn: activePlot.cropType, nameHi: activePlot.cropType, nameMr: activePlot.cropType };
  const hasLabData = activePlot.nitrogenMgKg !== undefined && activePlot.phosphorusMgKg !== undefined;

  if (!hasLabData) {
    if (language === 'hi') {
      return {
        reply: `शून्य-बनावट सुरक्षा नियम (Zero-Fabrication Guardrail):\n\n${activePlot.name} के लिए प्रयोगशाला-प्रमाणित NPK टेलीमेट्री या मृदा स्वास्थ्य कार्ड (Soil Health Card) दर्ज नहीं है। एग्रोजेनेसिस सुरक्षा प्रोटोकॉल के तहत हम बिना लैब परीक्षण के काल्पनिक उर्वरक की मात्रा नहीं सुझाते।\n\nसलाह: रासायनिक खाद (Urea/DAP/MOP) डालने से पहले निकटतम कृषि विज्ञान केंद्र (KVK) से मिट्टी की जांच करवाएं।`,
        suggestedQuestions: [
          'मृदा स्वास्थ्य कार्ड कैसे दर्ज करें?',
          'क्या मुझे अभी सिंचाई करनी चाहिए?',
          'खेत की स्थिति दिखाएं',
        ],
      };
    }
    if (language === 'mr') {
      return {
        reply: `शून्य-बनावट नियम (Zero-Fabrication Guardrail):\n\n${activePlot.name} साठी लॅब-प्रमाणित NPK किंवा मृदा आरोग्य पत्रिका (Soil Health Card) उपलब्ध नाही. नियमानुसार, अचूक तपासणीशिवाय रासायनिक खतांचा डोस सुचवणे पिकासाठी व जमिनीसाठी घातक ठरू शकते.\n\nशिफारस: कृपया जवळच्या कृषी विज्ञान केंद्रात (KVK) माती परीक्षण करून घ्यावे.`,
        suggestedQuestions: [
          'माती परीक्षण अहवाल कसा नोंदवायचा?',
          'मातीतील ओलावा किती आहे?',
          'शेताची सद्यस्थिती काय आहे?',
        ],
      };
    }
    return {
      reply: `Zero-Fabrication Agronomic Guardrail Activated:\n\nComplete laboratory-verified NPK telemetry or Soil Health Card records are currently absent for ${activePlot.name}. Under AgroGenesis safety protocols, the agent will NEVER fabricate nutrient concentrations or prescribe chemical fertilizer doses without verified lab assays.\n\nRecommendation: Submit a composite soil sample to your local Krishi Vigyan Kendra (KVK) or district agricultural testing laboratory before applying Urea, DAP, or MOP.`,
      suggestedQuestions: [
        'Why is soil testing needed?',
        'What is the current soil moisture?',
        'What is your role as an agriculture AI agent?',
      ],
    };
  }

  // Lab data present
  return {
    reply:
      language === 'hi'
        ? `${activePlot.name} में दर्ज पोषक तत्व: नाइट्रोजन: ${activePlot.nitrogenMgKg} mg/kg, फास्फोरस: ${activePlot.phosphorusMgKg} mg/kg, पोटाश: ${activePlot.potassiumMgKg} mg/kg, pH: ${activePlot.currentPh ?? 6.5}। ${crop.nameHi} के लिए ICAR मानकों के अनुसार बेसल व टॉप-ड्रेसिंग का संतुलित विभाजन खत प्रबंधन टैब में देखें।`
        : language === 'mr'
        ? `${activePlot.name} चे नोंदवलेले घटक: नत्र (N): ${activePlot.nitrogenMgKg} mg/kg, स्फुरद (P): ${activePlot.phosphorusMgKg} mg/kg, पालाश (K): ${activePlot.potassiumMgKg} mg/kg. ICAR च्या शिफारशीनुसार युरिया व डीएपीचे योग्य नियोजन खत व्यवस्थापन टॅबमध्ये उपलब्ध आहे.`
        : `Verified Soil Chemistry for ${activePlot.name}:\n• Available Nitrogen (N): ${activePlot.nitrogenMgKg} mg/kg\n• Available Phosphorus (P): ${activePlot.phosphorusMgKg} mg/kg\n• Available Potassium (K): ${activePlot.potassiumMgKg} mg/kg\n• Soil pH: ${activePlot.currentPh ?? 6.8}\n\nBased on ICAR Recommended Doses of Fertilizer (RDF) for ${crop.nameEn}, split applications of Neem-Coated Urea with balanced basal DAP and MOP are calibrated in the Fertilization Management tab.`,
    suggestedQuestions: [
      `Should I irrigate my ${activePlot.cropType} crop?`,
      `What is the current condition of my farm?`,
      `What was my last irrigation action?`,
    ],
  };
}

function evaluateWeatherQuery(
  weather: WeatherData,
  language: SupportedLanguage
): { reply: string; suggestedQuestions: string[] } {
  if (language === 'hi') {
    return {
      reply: `मौसम एवं मान्सून पूर्वानुमान (स्रोत: ${weather.dataSource || 'IMD AWS Gridded Telemetry'}):\n\n• वर्तमान स्थिति: ${weather.condition}\n• तापमान: ${weather.temperatureC}°C, आर्द्रता: ${weather.humidityPercent}%\n• पिछले 24 घंटों में वर्षा: ${weather.rainfallMmPast24h} मिमी\n• आगामी 24 घंटों में वर्षा का अनुमान: ${weather.forecastRainfallMmNext24h} मिमी (${weather.forecastRainProbability}% संभावना)\n• मान्सून स्थिति: ${weather.monsoonStatus || 'सक्रिय मान्सून'}\n\nकृषि प्रभाव: यदि वर्षा 15 मिमी से अधिक होने की संभावना हो, तो एजेंट भूजल बचत हेतु सिंचाई स्वतः रोक देता है।`,
      suggestedQuestions: [
        'क्या आगामी वर्षा से सिंचाई प्रभावित होगी?',
        'वर्तमान मिट्टी की नमी कितनी है?',
        'खेत की स्थिति दिखाएं',
      ],
    };
  }

  if (language === 'mr') {
    return {
      reply: `हवामान व पर्जन्यमान अंदाज (स्रोत: ${weather.dataSource || 'IMD AWS Gridded'}):\n\n• हवामान स्थिती: ${weather.condition}\n• तापमान: ${weather.temperatureC}°C, आर्द्रता: ${weather.humidityPercent}%\n• मागील २४ तासांतील पाऊस: ${weather.rainfallMmPast24h} मिमी\n• पुढील २४ तासांत पावसाचा अंदाज: ${weather.forecastRainfallMmNext24h} मिमी (${weather.forecastRainProbability}% संभाव्यता)\n• मान्सून प्रवाह: ${weather.monsoonStatus || 'सक्रिय'}\n\nशेतीवरील परिणाम: मुसळधार पावसाच्या शक्यतेमुळे पाण्याचा अपव्यय टाळण्यासाठी स्वयंचलित सिंचन रोखले जाते.`,
      suggestedQuestions: [
        'सध्या पिकाला पाणी द्यावे का?',
        'मातीतील ओलावा किती आहे?',
        'शेताची सद्यस्थिती काय आहे?',
      ],
    };
  }

  return {
    reply: `Weather Telemetry & Monsoon Outlook (Data Source: ${weather.dataSource || 'IMD AWS Gridded Telemetry'}):\n\n• Atmospheric Condition: ${weather.condition}\n• Ambient Temperature: ${weather.temperatureC}°C, Relative Humidity: ${weather.humidityPercent}%\n• Past 24h Recorded Rainfall: ${weather.rainfallMmPast24h} mm\n• Forecast 24h Rainfall: ${weather.forecastRainfallMmNext24h} mm (${weather.forecastRainProbability}% probability)\n• Southwest Monsoon Phase: ${weather.monsoonStatus || 'Active Monsoon'}\n\nAgronomic Impact: When forecast precipitation exceeds 15 mm, the agent automatically activates rainfall lockouts to conserve electricity, reduce tubewell pumping, and prevent root waterlogging.`,
    suggestedQuestions: [
      'Should I irrigate now?',
      'What is the current soil moisture?',
      'What is the current condition of my farm?',
    ],
  };
}

function evaluateActionHistory(
  farmStore: FarmStore,
  language: SupportedLanguage
): { reply: string; suggestedQuestions: string[] } {
  const actions = farmStore.actions;
  const decisions = farmStore.decisions;
  const waterSaved = farmStore.totalWaterSavedLiters;

  if (actions.length === 0 && decisions.length === 0) {
    return {
      reply:
        language === 'hi'
          ? 'अभी तक कोई पिछला सिमुलेटेड सिंचाई एक्शन दर्ज नहीं हुआ है। एजेंट पर्यावरण की सतत निगरानी कर रहा है।'
          : language === 'mr'
          ? 'अद्याप कोणतीही मागील सिंचन कृती नोंदवलेली नाही. एजंट नियमित निरीक्षण करत आहे.'
          : 'No previous irrigation actions have been recorded yet in this session. The agent is actively monitoring sensor telemetry in passive perception mode.',
      suggestedQuestions: [
        'What is the current condition of my farm?',
        'Should I irrigate my rice crop?',
        'What is your role as an agriculture AI agent?',
      ],
    };
  }

  const recent = actions.slice(0, 3);
  const actionList = recent
    .map(
      (a) =>
        `• [${a.actionType}] on ${a.plotName}: Status=${a.executionStatus}, Approved=${a.approvalStatus}, Water=${a.parameters.volumeLiters || 0}L`
    )
    .join('\n');

  if (language === 'hi') {
    return {
      reply: `पिछली कार्रवाइयों का इतिहास (Episodic Action Memory):\n\n${actionList || 'कोई सक्रिय एक्शन नहीं'}\n\n• कुल जल बचत: लगभग ${waterSaved.toLocaleString()} लीटर वर्षा आधारित लॉकआउट व सटीक समय निर्धारण द्वारा सुरक्षित।\n• कुल विश्लेषित निर्णय: ${decisions.length}।`,
      suggestedQuestions: [
        'क्या पिछली सिमुलेशन सफल रही?',
        'वर्तमान खेत की स्थिति क्या है?',
        'क्या अभी सिंचाई करनी चाहिए?',
      ],
    };
  }

  return {
    reply: `Episodic Action & Decision History:\n\n${actionList || '• All recent decisions held in passive monitoring'}\n\n• Cumulative Groundwater Conserved: ~${waterSaved.toLocaleString()} Liters via rainfall lockout and precision pulsing\n• Total Agent Decisions Logged: ${decisions.length}\n• All actions adhere to Level 3 Human Approval before pump simulator engages.`,
    suggestedQuestions: [
      'Did the previous simulation succeed?',
      'What is the current condition of my farm?',
      'Should I irrigate my rice crop?',
    ],
  };
}

function evaluateMemoryQuery(
  farmStore: FarmStore,
  language: SupportedLanguage
): { reply: string; suggestedQuestions: string[] } {
  const mem = farmStore.getMemory();
  const readingsCount = mem.shortTerm.latestReadings.length;
  const decisionsCount = mem.episodic.previousDecisions.length;
  const alertsCount = mem.shortTerm.activeAlerts.length;

  return {
    reply:
      language === 'hi'
        ? `एजेंट स्मृति रिपोर्ट (Tripartite Agent Memory):\n\n1. अल्पकालिक स्मृति (Short-Term Memory): ${readingsCount} ताज़ा सेंसर रीडिंग, ${alertsCount} सक्रिय अलर्ट, वर्तमान कार्य: "${mem.shortTerm.currentTask}"\n2. प्रासंगिक स्मृति (Episodic Memory): ${decisionsCount} पूर्व निर्णय, ${mem.episodic.approvedActions.length} स्वीकृत कार्रवाइयां\n3. शब्दार्थ स्मृति (Semantic Memory): भारतीय कृषि अनुसंधान परिषद (ICAR) फसल डेटाबेस (${mem.semantic.supportedCropsCount} फसलें), ${mem.semantic.soilProfilesCount} मृदा प्रकार।`
        : language === 'mr'
        ? `एआय एजंट स्मृती अहवाल (Tripartite Memory System):\n\n१. अल्पकालीन स्मृती (Short-Term): ${readingsCount} सेन्सर वाचने, ${alertsCount} इशारे.\n२. घटनात्मक स्मृती (Episodic): ${decisionsCount} मागील सिंचन निर्णय आणि शेतकरी अभिप्राय.\n३. मूलभूत कृषी ज्ञान (Semantic): आयसीएआर (ICAR) पिके, मातीचे प्रकार व महाराष्ट्र हवामान विभाग निकष.`
        : `Agent Tripartite Memory Status:\n\n1. Short-Term Perception Cache: Holding ${readingsCount} active sensor observations across plots, ${alertsCount} active alerts, current task: "${mem.shortTerm.currentTask}"\n2. Episodic Memory: Storing ${decisionsCount} previous utility decisions, ${mem.episodic.approvedActions.length} approved actuator executions, and farmer feedback loops.\n3. Semantic Memory: Persistent ICAR agronomic baselines, phenological water requirements (Kc), Soil Health Card standards, and regional agro-climatic zone parameters for ${farmStore.farm.state}, India.`,
    suggestedQuestions: [
      'What happened during the last monitoring cycle?',
      'What is the current condition of my farm?',
      'What is your role as an agriculture AI agent?',
    ],
  };
}

function evaluateCropHealth(
  activePlot: Plot,
  weather: WeatherData,
  message: string,
  language: SupportedLanguage
): { reply: string; suggestedQuestions: string[] } {
  const isMoistureLow = activePlot.currentMoisture < activePlot.targetMoistureRange.min;
  const isMoistureHigh = activePlot.currentMoisture > activePlot.targetMoistureRange.max;
  const isOptimal = !isMoistureLow && !isMoistureHigh;

  const crop = INDIAN_CROP_DATABASE[activePlot.cropType] || {
    nameEn: activePlot.cropType,
    nameHi: activePlot.cropType,
    nameMr: activePlot.cropType,
  };

  let moistureStatusEn = 'Optimal';
  let moistureDescEn = `Soil moisture is at ${activePlot.currentMoisture.toFixed(1)}%, within the safe threshold (${activePlot.targetMoistureRange.min}%–${activePlot.targetMoistureRange.max}%). Stomatal conductance and cell turgor are maintained.`;
  if (isMoistureLow) {
    moistureStatusEn = 'Moisture Deficit Stress';
    moistureDescEn = `Soil moisture is ${activePlot.currentMoisture.toFixed(1)}%, below the minimum critical threshold of ${activePlot.targetMoistureRange.min}%. This can induce stomatal closure, reduce photosynthetic transpiration, and stunt tillering.`;
  } else if (isMoistureHigh) {
    moistureStatusEn = 'Waterlogging / Hypoxia Risk';
    moistureDescEn = `Soil moisture is ${activePlot.currentMoisture.toFixed(1)}%, exceeding the upper threshold of ${activePlot.targetMoistureRange.max}%. Root zone saturation limits dissolved oxygen uptake and increases root rot susceptibility.`;
  }

  // Microclimate fungal pathogen risk
  const isHighHumidity = (activePlot.currentHumidity || weather.humidityPercent || 70) > 75;
  const isWarm = (activePlot.currentTemp || weather.temperatureC || 25) >= 24;
  const fungalRiskEn = isHighHumidity && isWarm
    ? `High relative humidity (${activePlot.currentHumidity}%) and warm canopy temperature (${activePlot.currentTemp}°C) create conditions conducive to foliar fungal pathogens (e.g., Blast, Sheath Blight in paddy).`
    : `Ambient temperature (${activePlot.currentTemp}°C) and relative humidity (${activePlot.currentHumidity}%) are currently within stable baseline limits.`;

  // Rainfall / Drainage
  const rainForecastMm = weather.forecastRainfallMmNext24h || 0;
  const weatherFactorEn = rainForecastMm >= 15
    ? `Imminent rainfall of ~${rainForecastMm} mm in the next 24h will replenish surface water, but lower terrace bunds must be checked for drainage to prevent prolonged inundation.`
    : `Low forecast precipitation (${rainForecastMm} mm) keeps water levels reliant on controlled irrigation pulses.`;

  // Nutrients
  const nutrientFactorEn = activePlot.nitrogenMgKg
    ? `Soil chemistry indicates Nitrogen at ${activePlot.nitrogenMgKg} mg/kg, Phosphorus at ${activePlot.phosphorusMgKg} mg/kg, Potassium at ${activePlot.potassiumMgKg} mg/kg, and soil pH ${activePlot.currentPh ?? 6.8}.`
    : `Soil nutrient telemetry is in baseline profile. A recent Soil Health Card or KVK soil test is recommended for calibrated NPK top-dressing during ${activePlot.growthStage}.`;

  if (language === 'hi') {
    return {
      reply: `फसल स्वास्थ्य विश्लेषण एवं प्रभावित करने वाले प्रमुख कारक (${activePlot.name}):\n\n` +
        `1. मृदा नमी एवं जल तनाव (Soil Moisture):\n` +
        `• वर्तमान नमी: ${activePlot.currentMoisture.toFixed(1)}% (लक्ष्य सीमा: ${activePlot.targetMoistureRange.min}% - ${activePlot.targetMoistureRange.max}%)\n` +
        `• स्थिति: ${isOptimal ? 'सामान्य व अनुकूल' : isMoistureLow ? 'नमी की कमी (तनाव)' : 'अधिक जलभराव का जोखिम'}\n\n` +
        `2. सूक्ष्म जलवायु एवं तापमान/आर्द्रता (Microclimate & Disease Risk):\n` +
        `• तापमान: ${activePlot.currentTemp}°C, आर्द्रता: ${activePlot.currentHumidity}%\n` +
        `• प्रभाव: ${isHighHumidity ? 'उच्च आर्द्रता के कारण फंगल रोगों (जैसे ब्लास्ट या शीथ ब्लाइट) का खतरा बढ़ सकता है।' : 'वर्तमान तापमान व आर्द्रता सामान्य सीमा में हैं।'}\n\n` +
        `3. मौसम एवं वर्षा का प्रभाव (Monsoon Impact):\n` +
        `• आगामी 24 घंटे में वर्षा: ${rainForecastMm} मिमी (${weather.forecastRainProbability}% संभावना)\n` +
        `• सुझाव: यदि बारिश तेज होती है, तो खेत से अतिरिक्त पानी की निकासी सुनिश्चित करें।\n\n` +
        `4. पोषक तत्व एवं पोषण स्थिति (NPK Nutrients):\n` +
        `• विकास चरण: ${activePlot.cropType} (${activePlot.growthStage})\n` +
        `• सुझाव: कल्ले फूटते समय संतुलित यूरिया और जिंक की आवश्यकता होती है। विशिष्ट पत्ती विकृति के लिए Crop Health टैब में फोटो अपलोड करें।`,
      suggestedQuestions: [
        `क्या ${activePlot.cropType} में अभी सिंचाई करनी चाहिए?`,
        `वर्तमान मिट्टी की नमी कितनी है?`,
        `खेत के पोषक तत्वों (NPK) की स्थिति क्या है?`,
      ],
    };
  }

  if (language === 'mr') {
    return {
      reply: `पीक आरोग्य विश्लेषण व परिणाम करणारे घटक (${activePlot.name}):\n\n` +
        `१. मातीतील ओलावा व पाण्याचा ताण (Soil Moisture):\n` +
        `• चालू ओलावा: ${activePlot.currentMoisture.toFixed(1)}% (इष्टतम मर्यादा: ${activePlot.targetMoistureRange.min}% - ${activePlot.targetMoistureRange.max}%)\n` +
        `• स्थिती: ${isOptimal ? 'अनुकूल व सुरक्षित' : isMoistureLow ? 'ओलाव्याची कमतरता (पाण्याचा ताण)' : 'पाणी साचण्याचा धोका'}\n\n` +
        `२. हवामान, तापमान व बुरशीजन्य रोगांचा धोका:\n` +
        `• तापमान: ${activePlot.currentTemp}°C, हवेतील आर्द्रता: ${activePlot.currentHumidity}%\n` +
        `• निरीक्षण: ${isHighHumidity ? 'जास्त आर्द्रतेमुळे करपा किंवा तांबेरा सारख्या रोगांचा प्रादुर्भाव होऊ शकतो.' : 'हवामान स्थिती सध्या स्थिर आहे.'}\n\n` +
        `३. पावसाचा अंदाज व निचरा व्यवस्था:\n` +
        `• पुढील २४ तासांत पाऊस: ${rainForecastMm} मिमी\n` +
        `• व्यवस्थापन: अतिवृष्टी झाल्यास शेतात पाणी साचणार नाही याची दक्षता घ्या.\n\n` +
        `४. अन्नद्रव्य व्यवस्थापन (NPK Status):\n` +
        `• पीक अवस्था: ${activePlot.cropType} (${activePlot.growthStage})\n` +
        `• शिफारस: पानांवर पिवळे डाग किंवा रोग लक्षणे तपासण्यासाठी Crop Health टॅबमध्ये फोटो स्कॅन करा.`,
      suggestedQuestions: [
        `सध्या पिकाला पाणी द्यावे का?`,
        `मातीतील ओलावा किती आहे?`,
        `मातीतील खतांची स्थिती काय आहे?`,
      ],
    };
  }

  return {
    reply: `Factors Currently Affecting the Health of Your ${activePlot.cropType} Crop (${activePlot.name}):\n\n` +
      `1. Soil Moisture & Root Zone Hydration:\n` +
      `• Status: ${moistureStatusEn}\n` +
      `• Analysis: ${moistureDescEn}\n\n` +
      `2. Microclimate & Foliar Pathogen Pressure:\n` +
      `• Canopy Telemetry: ${activePlot.currentTemp}°C Ambient Temperature, ${activePlot.currentHumidity}% Relative Humidity\n` +
      `• Agronomic Risk: ${fungalRiskEn}\n\n` +
      `3. Monsoon Weather & Soil Aeration:\n` +
      `• 24-Hour Outlook: ${weatherFactorEn}\n\n` +
      `4. Nutrient Availability & Phenological Demand:\n` +
      `• Crop & Stage: ${activePlot.cropType} at ${activePlot.growthStage} Stage\n` +
      `• Nutrition Status: ${nutrientFactorEn}\n\n` +
      `Summary Recommendation: To identify specific visible leaf lesions, chlorosis patterns, or insect pests, upload a canopy leaf photo in the Crop Health tab for instant computer-vision diagnostic.`,
    suggestedQuestions: [
      `Should I irrigate my ${activePlot.cropType} crop?`,
      `What is the current soil moisture?`,
      `What is the weather forecast at my farm?`,
      `What is the NPK condition of my soil?`,
    ],
  };
}

function evaluateSimulationAction(
  activePlot: Plot,
  language: SupportedLanguage
): { reply: string; suggestedQuestions: string[] } {
  return {
    reply:
      language === 'hi'
        ? `सिमुलेशन प्रस्ताव तैयार किया गया:\n\n${activePlot.name} के लिए 20 मिनट के ड्रिप सिंचन पल्स का सिमुलेशन प्रस्ताव तैयार है। सुरक्षा स्तर 3 (Level 3 Gate) के अनुसार, जब तक आप कंट्रोल सेंटर या सिंचाई निर्णय टैब में 'स्वीकार करें (Approve)' पर क्लिक नहीं करते, तब तक कोई सिमुलेशन शुरू नहीं होगा।`
        : language === 'mr'
        ? `सिम्युलेशन प्रस्ताव तयार आहे:\n\n${activePlot.name} साठी २० मिनिटांचा सिंचन पल्स तयार केला आहे. सेप्टी लेव्हल ३ नुसार, शेतकरी ऑपरेटरने मान्यता दिल्याशिवाय कोणताही पंप सुरू होणार नाही.`
        : `Simulation Proposal Prepared for ${activePlot.name}:\n\nA 20-minute simulated precision irrigation pulse has been calibrated. In accordance with Safety Level 3 Human-in-the-Loop constraints, the agent will not execute physical or simulated pumping without your explicit confirmation in the Agent Control Center or Irrigation Decisions panel.`,
    suggestedQuestions: [
      'What is the current soil moisture?',
      'What was my last irrigation action?',
      'What is the weather at my farm?',
    ],
  };
}

function evaluateUnknownOrClarification(
  message: string,
  language: SupportedLanguage
): { reply: string; suggestedQuestions: string[] } {
  return {
    reply:
      language === 'hi'
        ? 'मैं आपकी बात को पूरी तरह नहीं समझ पाया। मैं खेत की स्थिति, सिंचाई निर्णय, मौसम पूर्वानुमान, मृदा पोषक तत्व (NPK), फसल स्वास्थ्य या एजेंट की कार्यप्रणाली के बारे में आपकी सहायता कर सकता हूँ। कृपया इनमें से कोई प्रश्न पूछें।'
        : language === 'mr'
        ? 'मला आपला प्रश्न समजण्यास अडचण येत आहे. मी शेताची सद्यस्थिती, सिंचन नियोजन, हवामान अंदाज, मातीतील खते किंवा एजंटच्या कार्यपद्धतीबद्दल मदत करू शकतो.'
        : "I didn't quite catch the specifics of your inquiry. As the AgroGenesis AI agent, I specialize in: Farm Telemetry & Status, Irrigation Scheduling Decisions, Soil Health & NPK Analysis, Monsoon Weather Precautions, Crop Health Diagnostics, and Action History. How may I assist you with your farm?",
    suggestedQuestions: [
      'What is your role as an agriculture AI agent?',
      'What is the current condition of my farm?',
      'What is the current soil moisture?',
      'Should I irrigate my rice crop?',
    ],
  };
}

// -------------------------------------------------------------
// MAIN ORCHESTRATION PIPELINE (Section 2 & 5)
// -------------------------------------------------------------

export async function orchestrateConversationalResponse(
  req: ConversationalRequestContext,
  farmStore: FarmStore
): Promise<ConversationalChatResponse> {
  const startTime = Date.now();
  const trimmed = req.message.trim();
  const language = req.language || 'en';

  // 1. Message Validation
  if (!trimmed) {
    return {
      reply:
        language === 'hi'
          ? 'कृपया खेत या फसल से संबंधित अपना प्रश्न दर्ज करें।'
          : language === 'mr'
          ? 'कृपया शेताशी संबंधित आपला प्रश्न विचारा.'
          : 'Please enter an agricultural question regarding your farm or crops.',
      intent: 'UNKNOWN_OR_UNSUPPORTED',
      intentConfidence: 1.0,
      toolsUsed: [],
      source: 'rule_engine',
      dataSource: 'Local Validation',
      timestamp: new Date().toISOString(),
      suggestedQuestions: [
        'What is your role as an agriculture AI agent?',
        'What is the current condition of my farm?',
        'What is the current soil moisture?',
      ],
    };
  }

  // Active plot identification
  const activePlot =
    farmStore.plots.find((p) => p.id === req.plotId) ||
    farmStore.plots[0] || {
      id: 'plot-1',
      name: 'Thane Coastal Basin — Kharif Rice',
      farmId: 'farm-in-01',
      areaHa: 2.0,
      areaAcre: 4.94,
      cropType: 'Rice (Paddy)',
      growthStage: 'Tillering',
      season: 'Kharif',
      soilType: 'Clay Loam (Coastal Alluvium)',
      irrigationMethod: 'Drip Irrigation',
      waterSource: 'Borewell / Tube Well',
      targetMoistureRange: { min: 70, optimal: 85, max: 98 },
      currentMoisture: 80,
      currentTemp: 27,
      currentHumidity: 78,
      status: 'OPTIMAL',
    };

  // 1b. Section 7: Retain & Follow Conversational Context Setup
  const lower = trimmed.toLowerCase().replace(/[.,!?;:]/g, '').trim();

  // Location setting: "My farm is in Thane, Maharashtra."
  if (
    lower.startsWith('my farm is in') ||
    lower.startsWith('farm is in') ||
    lower.startsWith('i am located in') ||
    lower.startsWith('farm located in')
  ) {
    const locMatch = trimmed.replace(/^.*(?:in|at)\s+/i, '').replace(/[.,!?;:]/g, '').trim();
    const updatedContext = {
      ...(req.sessionContext || {}),
      location: locMatch || 'Thane, Maharashtra',
    };
    return {
      reply:
        language === 'hi'
          ? `समझ गया। आपका खेत ${locMatch} में स्थित है। आप कौन सी फसल उगा रहे हैं?`
          : language === 'mr'
          ? `समजले. आपले शेत ${locMatch} येथे आहे. आपण कोणते पीक घेत आहात?`
          : 'Understood. What crop are you growing?',
      intent: 'GENERAL_AGENT_INFO',
      intentConfidence: 0.98,
      toolsUsed: [],
      source: 'rule_engine',
      dataSource: 'Farmer Context',
      timestamp: new Date().toISOString(),
      conversationContext: updatedContext,
      suggestedQuestions: ['Rice.', 'Cotton.', 'Wheat.', 'Sugarcane.'],
    };
  }

  // Crop setting: "Rice." or "Rice" or "Cotton"
  const knownCrops = ['rice', 'paddy', 'wheat', 'cotton', 'sugarcane', 'maize', 'soybean', 'groundnut'];
  if (
    (knownCrops.includes(lower) || lower.startsWith('i am growing') || lower.startsWith('crop is')) &&
    !lower.includes('?') &&
    !lower.includes('should') &&
    !lower.includes('how') &&
    !lower.includes('what')
  ) {
    const cropName = lower.includes('rice') || lower.includes('paddy')
      ? 'Rice (Paddy)'
      : trimmed.replace(/^[.\s]+|[.\s]+$/g, '');
    const updatedContext = {
      ...(req.sessionContext || {}),
      crop: cropName,
    };
    return {
      reply:
        language === 'hi'
          ? `फसल को ${cropName} के रूप में दर्ज किया गया। वर्तमान विकास चरण क्या है?`
          : language === 'mr'
          ? `पीक ${cropName} म्हणून नोंदवले. सध्या पिकाची वाढीची अवस्था कोणती आहे?`
          : 'What is the current growth stage?',
      intent: 'GENERAL_AGENT_INFO',
      intentConfidence: 0.98,
      toolsUsed: [],
      source: 'rule_engine',
      dataSource: 'Farmer Context',
      timestamp: new Date().toISOString(),
      conversationContext: updatedContext,
      suggestedQuestions: ['Vegetative.', 'Tillering.', 'Panicle Initiation.', 'Grain Filling.'],
    };
  }

  // Growth stage setting: "Vegetative." or "Vegetative" or "Tillering"
  const knownStages = ['vegetative', 'tillering', 'panicle initiation', 'flowering', 'grain filling', 'ripening', 'harvest'];
  if (
    knownStages.some((st) => lower === st || lower === `${st}.` || lower.startsWith(`stage is ${st}`)) &&
    !lower.includes('?') &&
    !lower.includes('should') &&
    !lower.includes('what')
  ) {
    const stageName = trimmed.replace(/[.,!?;:]/g, '').trim();
    const updatedContext = {
      ...(req.sessionContext || {}),
      growthStage: stageName,
    };
    return {
      reply:
        language === 'hi'
          ? `मैंने चयनित फसल और विकास चरण (${stageName}) को दर्ज कर लिया है। अब मैं आपके खेत की स्थितियों का विश्लेषण करने के लिए इसका उपयोग कर सकता हूँ।`
          : language === 'mr'
          ? `मी निवडलेले पीक आणि अवस्था (${stageName}) नोंदवली आहे. आता मी शेताच्या अचूक विश्लेषणासाठी याचा वापर करू शकेन.`
          : 'I can now use the selected crop and growth stage to help analyze your farm conditions.',
      intent: 'GENERAL_AGENT_INFO',
      intentConfidence: 0.98,
      toolsUsed: [],
      source: 'rule_engine',
      dataSource: 'Farmer Context',
      timestamp: new Date().toISOString(),
      conversationContext: updatedContext,
      suggestedQuestions: [
        'What is the current condition of my farm?',
        'Should I irrigate my rice crop?',
        'What is the current soil moisture?',
        'What is the weather at my farm?',
      ],
    };
  }

  const weather = farmStore.simulationEngine.weather;
  const ai = getAiClient();

  // 2. Intent Classification
  const intentResult = await classifyUserIntent(trimmed, ai, {
    plotId: activePlot.id,
    crop: activePlot.cropType,
    growthStage: activePlot.growthStage,
    location: farmStore.farm.location,
  });

  const intent = intentResult.intent;

  // 3. Intent-Driven Tool Execution
  const toolsToExecute = intentResult.required_tools || [];
  const toolResults: any[] = [];
  const toolsUsedNames: string[] = [];

  for (const toolName of toolsToExecute) {
    try {
      const toolParams: Record<string, any> = {
        plotId: activePlot.id,
        cropType: activePlot.cropType,
        soilType: activePlot.soilType,
        location: farmStore.farm.location,
      };

      if (toolName === 'validateSensorData') {
        toolParams.sensorType = intentResult.entities.sensorType || 'soil_moisture';
        toolParams.value = activePlot.currentMoisture;
      }

      const res = await farmStore.executeToolByName(toolName, toolParams, 'USER_MANUAL');
      toolsUsedNames.push(toolName);
      toolResults.push({
        toolName,
        success: res.success,
        data: res.data,
      });
    } catch (toolErr: any) {
      console.warn(`Error executing tool ${toolName} for chat:`, toolErr?.message);
    }
  }

  // 4. Response Generation via Gemini (with Context & Grounding) or Specialized Rule Engine
  if (ai) {
    try {
      const historyContext = (req.history || [])
        .slice(-6)
        .map((h) => `${h.role === 'user' ? 'User' : 'Agent'}: ${h.content}`)
        .join('\n');

      const toolContextStr = toolResults.length > 0 ? JSON.stringify(toolResults, null, 2) : 'No tools required for this intent.';

      const prompt = `You are AgroGenesis, an autonomous AI agriculture agent for Indian precision farming.
Farmer's Exact Query: "${trimmed}"
Classified Intent: ${intent} (Confidence: ${intentResult.confidence})
Language Requirement: ${language === 'hi' ? 'Hindi (Devanagari script)' : language === 'mr' ? 'Marathi (Devanagari script)' : 'English'}

CONVERSATION HISTORY:
${historyContext || 'None'}

ACTIVE PARCEL CONTEXT:
- Name: ${activePlot.name}
- Crop: ${activePlot.cropType} (${activePlot.growthStage})
- Soil Type: ${activePlot.soilType}
- Current Simulated Soil Moisture: ${activePlot.currentMoisture.toFixed(1)}% (Target Band: ${activePlot.targetMoistureRange.min}% - ${activePlot.targetMoistureRange.max}%)
- Ambient: ${activePlot.currentTemp}°C, ${activePlot.currentHumidity}% Humidity
- Weather: ${weather.condition}, Past 24h Rain: ${weather.rainfallMmPast24h}mm, Forecast 24h Rain: ${weather.forecastRainfallMmNext24h}mm (${weather.forecastRainProbability}% probability)

EXECUTED TOOL RESULTS:
${toolContextStr}

CRITICAL INSTRUCTIONS:
1. ANSWER THE USER'S ACTUAL QUESTION DIRECTLY.
2. If intent is GENERAL_AGENT_INFO, explain your role, architecture, capabilities, or the difference between simulation and real sensor data as asked. DO NOT include an unrequested farm telemetry dump.
3. If intent is FARM_STATUS, summarize farm and parcel conditions (moisture vs target band, weather outlook, sensor validity), and explicitly identify the single most important agronomic action to take right now.
4. If intent is CROP_HEALTH, analyze the 4 factors affecting crop health: 1) Soil moisture / root zone hydration, 2) Canopy microclimate and foliar fungal risk, 3) Monsoon weather and drainage, and 4) Nutrients and growth stage.
5. If intent is SENSOR_ANALYSIS, answer specifically about the sensor or telemetry asked about.
6. If intent is IRRIGATION_DECISION, evaluate whether to irrigate or defer due to rain, citing evidence.
7. If intent is FERTILIZATION_ANALYSIS, strictly enforce the Zero-Fabrication Guardrail (never invent NPK values).
8. If intent is WEATHER_QUERY, focus on the weather and monsoon impact.
9. If intent is ACTION_HISTORY, summarize the actions and water conserved.
10. If intent is MEMORY_QUERY, explain short-term, episodic, and semantic memory.
11. Be polite, concise, professional, and scientifically grounded in Indian agronomic standards (ICAR/KVK).`;

      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
        },
      });

      if (geminiResponse.text && geminiResponse.text.trim().length > 10) {
        const finalReply = geminiResponse.text.trim();
        console.log('[AgentDiagnostics]', JSON.stringify({
          originalMessage: req.message,
          normalizedMessage: trimmed.toLowerCase(),
          classifierInput: trimmed,
          rawIntent: intentResult.intent,
          parsedIntent: intentResult.intent,
          validatedIntent: intent,
          selectedRoute: `Gemini-Grounded:${intent}`,
          toolsSelected: toolsUsedNames,
          toolExecutionResults: toolResults.map((t) => ({ tool: t.toolName, success: t.success })),
          finalResponseSource: 'gemini',
        }, null, 2));

        return {
          reply: finalReply,
          intent,
          intentConfidence: intentResult.confidence,
          toolsUsed: toolsUsedNames,
          toolResults,
          source: 'gemini',
          dataSource:
            toolsUsedNames.length > 0
              ? 'Real-Time In-Situ Probes & IMD Gridded'
              : 'AgroGenesis Agricultural Knowledge Base',
          timestamp: new Date().toISOString(),
          suggestedQuestions: getSuggestedQuestionsForIntent(intent, activePlot, language),
          conversationContext: {
            plotId: activePlot.id,
            crop: activePlot.cropType,
            growthStage: activePlot.growthStage,
            location: farmStore.farm.location,
          },
        };
      }
    } catch (genErr: any) {
      console.warn('Gemini response generation error, falling back to specialized rule engine:', genErr?.message);
    }
  }

  // Fallback to Specialized Rule Engine Decision Evaluators (Section 6)
  let fallbackResult: { reply: string; decision?: any; suggestedQuestions: string[] };

  switch (intent) {
    case 'GENERAL_AGENT_INFO':
      fallbackResult = evaluateAgentInfo(trimmed, language);
      break;
    case 'FARM_STATUS':
      fallbackResult = evaluateFarmStatus(farmStore, activePlot, weather, language, trimmed);
      break;
    case 'SENSOR_ANALYSIS':
      fallbackResult = evaluateSensorQuery(activePlot, trimmed, language);
      break;
    case 'IRRIGATION_DECISION':
      fallbackResult = evaluateIrrigationNeed(activePlot, weather, language);
      break;
    case 'FERTILIZATION_ANALYSIS':
      fallbackResult = evaluateFertilizationNeed(activePlot, language);
      break;
    case 'WEATHER_QUERY':
      fallbackResult = evaluateWeatherQuery(weather, language);
      break;
    case 'ACTION_HISTORY':
      fallbackResult = evaluateActionHistory(farmStore, language);
      break;
    case 'MEMORY_QUERY':
      fallbackResult = evaluateMemoryQuery(farmStore, language);
      break;
    case 'CROP_HEALTH':
      fallbackResult = evaluateCropHealth(activePlot, weather, trimmed, language);
      break;
    case 'SIMULATION_ACTION':
      fallbackResult = evaluateSimulationAction(activePlot, language);
      break;
    default:
      fallbackResult = evaluateUnknownOrClarification(trimmed, language);
      break;
  }

  console.log('[AgentDiagnostics]', JSON.stringify({
    originalMessage: req.message,
    normalizedMessage: trimmed.toLowerCase(),
    classifierInput: trimmed,
    rawIntent: intentResult.intent,
    parsedIntent: intentResult.intent,
    validatedIntent: intent,
    selectedRoute: `RuleEngineEvaluator:${intent}`,
    toolsSelected: toolsUsedNames,
    toolExecutionResults: toolResults.map((t) => ({ tool: t.toolName, success: t.success })),
    finalResponseSource: 'rule_engine',
  }, null, 2));

  return {
    reply: fallbackResult.reply,
    intent,
    intentConfidence: intentResult.confidence,
    toolsUsed: toolsUsedNames,
    toolResults,
    source: 'rule_engine',
    dataSource:
      toolsUsedNames.length > 0
        ? 'Real-Time In-Situ Probes & IMD Gridded Telemetry'
        : 'AgroGenesis Agricultural Knowledge Base',
    timestamp: new Date().toISOString(),
    decision: fallbackResult.decision,
    suggestedQuestions: fallbackResult.suggestedQuestions,
    conversationContext: {
      plotId: activePlot.id,
      crop: activePlot.cropType,
      growthStage: activePlot.growthStage,
      location: farmStore.farm.location,
    },
  };
}

function getSuggestedQuestionsForIntent(
  intent: string,
  plot: Plot,
  language: SupportedLanguage
): string[] {
  if (language === 'hi') {
    return [
      `क्या अभी ${plot.cropType} में पानी देना चाहिए?`,
      `मौसम का क्या पूर्वानुमान है?`,
      `खेत की वर्तमान स्थिति दिखाएं`,
    ];
  }
  if (language === 'mr') {
    return [
      `सध्या ${plot.cropType} पिकाला सिंचन करावे का?`,
      `हवामानाचा अंदाज कसा आहे?`,
      `मातीतील ओलावा किती आहे?`,
    ];
  }
  return [
    `What is the current condition of my farm?`,
    `Should I irrigate my ${plot.cropType} crop?`,
    `What is the weather at my farm?`,
  ];
}
