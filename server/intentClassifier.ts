import { GoogleGenAI, Type, Schema } from '@google/genai';
import { UserIntent, IntentClassificationResult, IntentEntities, AgentToolName } from '../src/types';

export const ALLOWED_INTENTS: UserIntent[] = [
  'GENERAL_AGENT_INFO',
  'FARM_STATUS',
  'SENSOR_ANALYSIS',
  'IRRIGATION_DECISION',
  'FERTILIZATION_ANALYSIS',
  'CROP_HEALTH',
  'WEATHER_QUERY',
  'ACTION_HISTORY',
  'MEMORY_QUERY',
  'SIMULATION_ACTION',
  'UNKNOWN_OR_UNSUPPORTED',
];

export const INTENT_TOOL_MAPPING: Record<UserIntent, AgentToolName[]> = {
  GENERAL_AGENT_INFO: [],
  FARM_STATUS: [
    'getFarmState',
    'getSensorReadings',
    'validateSensorData',
    'analyzeIrrigationNeed',
    'getWeatherInformation',
  ],
  SENSOR_ANALYSIS: ['getSensorReadings', 'validateSensorData'],
  IRRIGATION_DECISION: [
    'getFarmState',
    'getSensorReadings',
    'validateSensorData',
    'getWeatherInformation',
    'getCropProfile',
    'analyzeIrrigationNeed',
  ],
  FERTILIZATION_ANALYSIS: ['getSoilProfile', 'getCropProfile', 'analyzeFertilizationNeed'],
  CROP_HEALTH: [
    'getFarmState',
    'getCropProfile',
    'getSensorReadings',
    'validateSensorData',
    'getWeatherInformation',
    'analyzeCropHealth',
  ],
  WEATHER_QUERY: ['getWeatherInformation'],
  ACTION_HISTORY: ['getActionHistory', 'getFarmState'],
  MEMORY_QUERY: ['getAgentMemory'],
  SIMULATION_ACTION: ['simulateIrrigation', 'requestHumanApproval'],
  UNKNOWN_OR_UNSUPPORTED: [],
};

const INTENT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      enum: ALLOWED_INTENTS,
      description: 'The classified user intent',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Confidence score between 0.0 and 1.0',
    },
    entities: {
      type: Type.OBJECT,
      properties: {
        plotId: { type: Type.STRING, description: 'Plot ID if mentioned' },
        plotName: { type: Type.STRING, description: 'Plot name if mentioned' },
        crop: { type: Type.STRING, description: 'Crop mentioned (e.g. rice, cotton, wheat)' },
        growthStage: { type: Type.STRING, description: 'Growth stage mentioned' },
        location: { type: Type.STRING, description: 'Location or district mentioned' },
        sensorType: { type: Type.STRING, description: 'Sensor type mentioned (e.g. soil_moisture, temperature, humidity, ph)' },
        actionType: { type: Type.STRING, description: 'Action type mentioned' },
        queryTopic: { type: Type.STRING, description: 'Core topic of query' },
      },
      description: 'Extracted named entities',
    },
    needs_farm_data: {
      type: Type.BOOLEAN,
      description: 'Whether the query requires live farm sensor or plot data',
    },
    needs_clarification: {
      type: Type.BOOLEAN,
      description: 'Whether query is ambiguous and requires clarification',
    },
    clarification_question: {
      type: Type.STRING,
      description: 'Clarification question if needs_clarification is true',
    },
  },
  required: ['intent', 'confidence', 'entities', 'needs_farm_data', 'needs_clarification'],
};

/**
 * Deterministic Semantic Concept & Rule-Based Intent Classifier.
 * Operates with Zero-API dependency to guarantee resilient, high-accuracy classification.
 */
export function classifyIntentDeterministically(
  message: string,
  sessionContext?: { plotId?: string; crop?: string; growthStage?: string; location?: string }
): IntentClassificationResult {
  const raw = message.trim();
  const q = message.toLowerCase().trim();
  const entities: IntentEntities = {
    crop: sessionContext?.crop,
    growthStage: sessionContext?.growthStage,
    location: sessionContext?.location,
    plotId: sessionContext?.plotId,
  };

  // Extract explicit crops
  if (q.includes('rice') || q.includes('paddy') || q.includes('भात') || q.includes('धान')) {
    entities.crop = 'Rice (Paddy)';
  } else if (q.includes('cotton') || q.includes('कापूस') || q.includes('कपास')) {
    entities.crop = 'Cotton';
  } else if (q.includes('wheat') || q.includes('गहू') || q.includes('गेहूं')) {
    entities.crop = 'Wheat';
  } else if (q.includes('tomato') || q.includes('टोमॅटो') || q.includes('टमाटर')) {
    entities.crop = 'Tomato';
  } else if (q.includes('sugarcane') || q.includes('ऊस') || q.includes('गन्ना')) {
    entities.crop = 'Sugarcane';
  }

  // Extract growth stage
  if (q.includes('vegetative') || q.includes('शाकीय') || q.includes('वानस्पतिक')) {
    entities.growthStage = 'Vegetative';
  } else if (q.includes('tillering') || q.includes('फुटवे') || q.includes('कल्ले')) {
    entities.growthStage = 'Tillering';
  } else if (q.includes('flowering') || q.includes('panicle') || q.includes('फुलोरा') || q.includes('फूल')) {
    entities.growthStage = 'Panicle Initiation / Flowering';
  } else if (q.includes('ripening') || q.includes('grain filling') || q.includes('पक्वता')) {
    entities.growthStage = 'Grain Filling / Ripening';
  }

  // Extract location
  if (q.includes('thane') || q.includes('ठाणे')) {
    entities.location = 'Thane, Maharashtra';
  } else if (q.includes('maharashtra') || q.includes('महाराष्ट्र')) {
    entities.location = 'Maharashtra';
  } else if (q.includes('punjab') || q.includes('पंजाब')) {
    entities.location = 'Punjab';
  }

  // Extract sensor types
  if (q.includes('moisture') || q.includes('ओलावा') || q.includes('नमी') || q.includes('soil sensor')) {
    entities.sensorType = 'soil_moisture';
  } else if (q.includes('temp') || q.includes('तापमान')) {
    entities.sensorType = 'temperature';
  } else if (q.includes('humidity') || q.includes('आर्द्रता')) {
    entities.sensorType = 'humidity';
  } else if (q.includes('ph') || q.includes('सामू')) {
    entities.sensorType = 'soil_ph';
  }

  // Empty or pure whitespace check
  if (!q) {
    return {
      intent: 'UNKNOWN_OR_UNSUPPORTED',
      confidence: 1.0,
      entities,
      required_tools: [],
      needs_farm_data: false,
      needs_clarification: true,
      clarification_question: 'Please enter an agricultural inquiry or question about your farm.',
    };
  }

  // Intent Scoring Table for Semantic Evaluation
  const scores: Record<UserIntent, number> = {
    GENERAL_AGENT_INFO: 0,
    FARM_STATUS: 0,
    SENSOR_ANALYSIS: 0,
    IRRIGATION_DECISION: 0,
    FERTILIZATION_ANALYSIS: 0,
    CROP_HEALTH: 0,
    WEATHER_QUERY: 0,
    ACTION_HISTORY: 0,
    MEMORY_QUERY: 0,
    SIMULATION_ACTION: 0,
    UNKNOWN_OR_UNSUPPORTED: 0,
  };

  // -------------------------------------------------------------
  // 1. CROP_HEALTH SEMANTIC MATCHING
  // Covers: factors affecting health, not growing properly/well, stress causes,
  // leaf yellowing/chlorosis, disease signs, pests, wilting, crop health analysis.
  // -------------------------------------------------------------
  if (
    /factors? affecting.*(health|growth|development)/i.test(q) ||
    /factors? affecting.*(my|the)?.*(crop|plants?|rice|wheat|cotton|tomato)/i.test(q) ||
    /affecting the health of (my|the)?.*(crop|plants?|rice|wheat|cotton|tomato)/i.test(q) ||
    /affecting (my|the)?.*(crop|plants?|rice|wheat|cotton).*health/i.test(q) ||
    /factors?.*affecting.*(crop|health)/i.test(q) ||
    /health of (my|the)? (crop|plants?|rice|cotton|wheat|tomato)/i.test(q) ||
    /crop health/i.test(q) ||
    /plant health/i.test(q)
  ) {
    scores.CROP_HEALTH += 10;
  }

  if (
    /not growing (well|properly|normally|fast|right)/i.test(q) ||
    /why is (my|the)?.*crop not growing/i.test(q) ||
    /why is (my|the)?.*rice.*not growing/i.test(q) ||
    /stunted (growth|crop|plants?)/i.test(q) ||
    /poor (crop )?growth/i.test(q) ||
    /slow (crop )?growth/i.test(q) ||
    /crop growth problem/i.test(q)
  ) {
    scores.CROP_HEALTH += 9;
  }

  if (
    /analy[zs]e (my )?(crop|plant)('?s)? (current )?health/i.test(q) ||
    /analy[zs]e.*crop.*health/i.test(q) ||
    /is (my|the)? (crop|rice|wheat|cotton) healthy/i.test(q) ||
    /crop healthy based on/i.test(q) ||
    /how healthy is my crop/i.test(q) ||
    /check (my )?(crop|plant) health/i.test(q)
  ) {
    scores.CROP_HEALTH += 9;
  }

  if (
    /signs of (crop |plant )?stress/i.test(q) ||
    /causing stress in (my )?(plants?|crops?)/i.test(q) ||
    /stress in (my )?(plants?|crops?)/i.test(q) ||
    /crop.*showing.*stress/i.test(q) ||
    /plant stress/i.test(q) ||
    /crop stress/i.test(q)
  ) {
    scores.CROP_HEALTH += 9;
  }

  if (
    /problems? (could be )?affecting (my |the )?crop/i.test(q) ||
    /problems? (with|affecting) (my |the )?(crop|plants?)/i.test(q) ||
    /what is wrong with my (crop|plants?|rice)/i.test(q) ||
    /what is affecting (my )?crop/i.test(q)
  ) {
    scores.CROP_HEALTH += 8;
  }

  if (
    /why are (my )?.*leav(es|ing).*turning yellow/i.test(q) ||
    /leav(es|ing).*turning yellow/i.test(q) ||
    /yellow(ing)? leav(es|ing)/i.test(q) ||
    /yellow(ish)? spots/i.test(q) ||
    /chlorosis|necrosis|wilting|wilted|drooping leav/i.test(q) ||
    /leaf curl|leaf spot|blight|blast|rust|fung(us|al)|pest|disease|stem borer|planthopper/i.test(q)
  ) {
    scores.CROP_HEALTH += 9;
  }

  // Multilingual CROP_HEALTH (Marathi / Hindi)
  if (
    /पिकाचे आरोग्य|पीक निरोगी|पिकाची वाढ|पाने पिवळी|रोग|कीड|करपा|तुडतुडे|पिकावर परिणाम/i.test(raw) ||
    /फसल स्वास्थ्य|फसल का स्वास्थ्य|फसल की बढ़त|पौधे स्वस्थ|पत्तियां पीली|कीट|रोग|झुलसा|तनाव|फसल में समस्या/i.test(raw)
  ) {
    scores.CROP_HEALTH += 10;
  }

  // -------------------------------------------------------------
  // 2. FARM_STATUS SEMANTIC MATCHING
  // Covers: analyze farm conditions, identify most important action, overview of farm,
  // condition of field/farm, farm status summary, decision support priority actions.
  // -------------------------------------------------------------
  if (
    /analy[zs]e.*(farm|field).*(condition|status|situation)/i.test(q) ||
    /analy[zs]e.*(condition|status).*(farm|field)/i.test(q) ||
    /farm condition|field condition/i.test(q) ||
    /condition of (my|the)? (farm|field|parcels?)/i.test(q) ||
    /current condition of (my )?farm/i.test(q) ||
    /status of (my )?farm|farm status/i.test(q) ||
    /farm overview|overview of my (current )?farm/i.test(q) ||
    /how is my farm doing|how's my farm doing|how is the farm doing/i.test(q) ||
    /summarize my farm|farm summary/i.test(q) ||
    /overall status of (my )?farm/i.test(q) ||
    /state of (my )?farm|situation on (my )?farm/i.test(q)
  ) {
    scores.FARM_STATUS += 10;
  }

  // Decision-support and prioritized action identification
  if (
    /action(s)? (i|we) should take/i.test(q) ||
    /what action(s)? (should|can|must) (i|we) take/i.test(q) ||
    /identify the (most )?important action/i.test(q) ||
    /most important action/i.test(q) ||
    /most urgent action/i.test(q) ||
    /what should i do (on|for|with) my (farm|field|crop)/i.test(q) ||
    /recommend(ed)? (next )?action/i.test(q) ||
    /what (is|are) (the )?next step(s)?/i.test(q) ||
    /priority action/i.test(q) ||
    /advise (me|what to do) on my farm/i.test(q)
  ) {
    scores.FARM_STATUS += 9;
  }

  // Compound concept: farm/field + condition + action
  if (
    /(farm|field).*(condition|status).*action/i.test(q) ||
    /action.*(farm|field).*(condition|status)/i.test(q) ||
    /analy[zs]e.*farm.*action/i.test(q)
  ) {
    scores.FARM_STATUS += 10;
  }

  // Multilingual FARM_STATUS
  if (
    /शेताची सद्यस्थिती|माझे शेत कसे आहे|शेताचा आढावा|शेताची स्थिती|शेताचा अहवाल|काय कृती करावी|महत्त्वाची कृती/i.test(raw) ||
    /खेत की वर्तमान स्थिति|खेत का हाल|फार्म स्टेटस|मेरे खेत का विवरण|खेत कैसा है|क्या कार्रवाई करनी चाहिए|महत्वपूर्ण कार्रवाई/i.test(raw)
  ) {
    scores.FARM_STATUS += 10;
  }

  // -------------------------------------------------------------
  // 3. IRRIGATION_DECISION SEMANTIC MATCHING
  // Covers: should I irrigate, does my field need water, safe to irrigate before rain,
  // why did you recommend delaying irrigation, watering timing.
  // -------------------------------------------------------------
  if (
    /should i (irrigate|water)/i.test(q) ||
    /does (my|the)?.*(field|crop|rice|soil|plant).*need (irrigation|water|watering)/i.test(q) ||
    /need(s)? (irrigation|water|watering)/i.test(q) ||
    /water (my|the)? (crop|field|plants?|rice|paddy)/i.test(q) ||
    /irrigate (my|the)? (crop|field|plants?|rice|paddy)/i.test(q)
  ) {
    scores.IRRIGATION_DECISION += 10;
  }

  if (
    /safe to irrigate/i.test(q) ||
    /irrigate before (the )?(monsoon|rain)/i.test(q) ||
    /water before (the )?(monsoon|rain)/i.test(q) ||
    /delay(ing)? irrigation/i.test(q) ||
    /defer(ring)? irrigation/i.test(q) ||
    /why (did you )?recommend delaying/i.test(q) ||
    /postpone irrigation/i.test(q) ||
    /hold off on (irrigation|watering)/i.test(q)
  ) {
    scores.IRRIGATION_DECISION += 10;
  }

  if (
    /when should i (irrigate|water)/i.test(q) ||
    /irrigation (schedule|decision|timing|recommendation)/i.test(q) ||
    /turn on (the )?(pump|tubewell)/i.test(q) ||
    /start (the )?(pump|watering)/i.test(q)
  ) {
    scores.IRRIGATION_DECISION += 8;
  }

  // Multilingual IRRIGATION_DECISION
  if (
    /सिंचन करावे का|पाणी द्यावे का|पाणी कधी द्यावे|सिंचनाची गरज|पंप सुरू करावा का|सिंचन पुढे ढकलावे/i.test(raw) ||
    /सिंचाई करनी चाहिए|पानी देना चाहिए|सिंचाई की जरूरत|पानी कब दें|सिंचाई का निर्णय|पंप चलाएं|सिंचाई स्थगित/i.test(raw)
  ) {
    scores.IRRIGATION_DECISION += 10;
  }

  // -------------------------------------------------------------
  // 4. FERTILIZATION_ANALYSIS SEMANTIC MATCHING
  // Covers: apply fertilizer, nutrient deficiency, soil nutrient info missing,
  // why do I need a soil test, NPK, Soil Health Card, KVK testing.
  // -------------------------------------------------------------
  if (
    /apply fertilizer/i.test(q) ||
    /should i (fertilize|apply fertilizer|give urea|add dap)/i.test(q) ||
    /fertilizer (dose|dosage|recommendation|application)/i.test(q) ||
    /chemical fertilizer/i.test(q)
  ) {
    scores.FERTILIZATION_ANALYSIS += 10;
  }

  if (
    /soil nutrient (information|data) (is )?missing/i.test(q) ||
    /what nutrient(s)? (is|are) missing/i.test(q) ||
    /nutrient (information|status|deficiency|levels?)/i.test(q) ||
    /\b(npk|nitrogen|phosphorus|potassium|potash|urea|dap|mop)\b/i.test(q)
  ) {
    scores.FERTILIZATION_ANALYSIS += 9;
  }

  if (
    /why do i need a soil test/i.test(q) ||
    /need a soil test/i.test(q) ||
    /soil (health card|test|testing|sample)/i.test(q) ||
    /krishi vigyan kendra|kvk test/i.test(q)
  ) {
    scores.FERTILIZATION_ANALYSIS += 10;
  }

  // Multilingual FERTILIZATION_ANALYSIS
  if (
    /खत|खताची मात्रा|युरिया|डीएपी|माती परीक्षण|मृदा आरोग्य पत्रिका|एनपीके|पोषक घटक/i.test(raw) ||
    /उर्वरक|खाद|यूरिया|डीएपी|मृदा परीक्षण|मिट्टी की जांच|मृदा स्वास्थ्य कार्ड|पोषक तत्व/i.test(raw)
  ) {
    scores.FERTILIZATION_ANALYSIS += 10;
  }

  // -------------------------------------------------------------
  // 5. SENSOR_ANALYSIS SEMANTIC MATCHING
  // Covers: current soil moisture, temperature sensor working, sensor readings valid,
  // sensor failure, what happens if sensor stops working.
  // -------------------------------------------------------------
  if (
    /how much (soil )?moisture/i.test(q) ||
    /what is (my |the )?(current )?soil moisture/i.test(q) ||
    /current soil moisture/i.test(q) ||
    /moisture reading/i.test(q) ||
    /current (soil )?temp(erature)?/i.test(q) ||
    /current humidity/i.test(q) ||
    /current (soil )?ph/i.test(q)
  ) {
    scores.SENSOR_ANALYSIS += 9;
  }

  if (
    /is (my |the )?.*sensor working/i.test(q) ||
    /are (my |the )?sensors? working/i.test(q) ||
    /sensor readings? (valid|accurate|correct|abnormal)/i.test(q) ||
    /are (my |the )?sensor readings? valid/i.test(q) ||
    /sensor (status|health|diagnostic|calibration)/i.test(q)
  ) {
    scores.SENSOR_ANALYSIS += 10;
  }

  if (
    /what happens if (my )?.*sensor stops/i.test(q) ||
    /sensor (stop|stopped|broken|failed|failure|anomaly|flatline|fault)/i.test(q) ||
    /sensor not working/i.test(q)
  ) {
    scores.SENSOR_ANALYSIS += 10;
  }

  // Multilingual SENSOR_ANALYSIS
  if (
    /सेन्सर चालू आहे का|सेन्सर काम करतो का|सेन्सर खराब|मातीतील ओलावा किती|सेन्सर वाचन/i.test(raw) ||
    /सेंसर काम कर रहा है|सेंसर खराब|सेंसर बंद|मिट्टी की नमी कितनी है|सेंसर रीडिंग/i.test(raw)
  ) {
    scores.SENSOR_ANALYSIS += 10;
  }

  // -------------------------------------------------------------
  // 6. WEATHER_QUERY SEMANTIC MATCHING
  // Covers: weather at farm, weather forecast, rain probability, monsoon condition.
  // Note: if query asks whether to irrigate, IRRIGATION_DECISION handles it.
  // -------------------------------------------------------------
  if (
    /weather at (my|the)? farm/i.test(q) ||
    /what is the weather/i.test(q) ||
    /weather forecast/i.test(q) ||
    /current weather/i.test(q) ||
    /rain(fall)? forecast/i.test(q) ||
    /rain probability/i.test(q) ||
    /is it going to rain/i.test(q) ||
    /will it rain/i.test(q) ||
    /monsoon (forecast|condition|update)/i.test(q)
  ) {
    if (!scores.IRRIGATION_DECISION) {
      scores.WEATHER_QUERY += 10;
    } else {
      scores.WEATHER_QUERY += 2;
    }
  }

  // Multilingual WEATHER_QUERY
  if (
    /हवामान अंदाज|पावसाचा अंदाज|पाऊस पडेल का|मान्सूनची स्थिती|हवामान काय आहे/i.test(raw) ||
    /मौसम का हाल|बारिश की संभावना|वर्षा का पूर्वानुमान|मानसून की स्थिति|मौसम कैसा है/i.test(raw)
  ) {
    if (!scores.IRRIGATION_DECISION) {
      scores.WEATHER_QUERY += 10;
    }
  }

  // -------------------------------------------------------------
  // 7. GENERAL_AGENT_INFO SEMANTIC MATCHING
  // Covers: what is your role, how do you work, what type of intelligent agent,
  // what tools can you use, architecture, simulation vs real sensor data.
  // -------------------------------------------------------------
  if (
    /what is your role/i.test(q) ||
    /role as an agriculture ai agent/i.test(q) ||
    /who are you/i.test(q) ||
    /what can you do/i.test(q) ||
    /about yourself/i.test(q) ||
    /your capabilities/i.test(q)
  ) {
    scores.GENERAL_AGENT_INFO += 10;
  }

  if (
    /how do you work/i.test(q) ||
    /how does (your |the )?agent work/i.test(q) ||
    /cognitive loop|cognitive architecture/i.test(q)
  ) {
    scores.GENERAL_AGENT_INFO += 10;
  }

  if (
    /what type of intelligent agent/i.test(q) ||
    /type of intelligent agent/i.test(q) ||
    /peas model/i.test(q)
  ) {
    scores.GENERAL_AGENT_INFO += 10;
  }

  if (
    /what tools can you use/i.test(q) ||
    /what tools do you have/i.test(q) ||
    /available tools/i.test(q) ||
    /which tools do you have/i.test(q) ||
    /tool registry/i.test(q)
  ) {
    scores.GENERAL_AGENT_INFO += 10;
  }

  if (
    /difference between simulation and real/i.test(q) ||
    /simulation vs real/i.test(q) ||
    /real sensor data vs simulation/i.test(q)
  ) {
    scores.GENERAL_AGENT_INFO += 10;
  }

  // Multilingual GENERAL_AGENT_INFO
  if (
    /तुमची भूमिका काय|तुम्ही कसे काम करता|तुम्ही कोण आहात|एजंटची माहिती|साधने कोणती आहेत/i.test(raw) ||
    /आपकी क्या भूमिका है|आप कैसे काम करते हैं|आप कौन हैं|एजेंट की कार्यप्रणाली|आपके टूल्स क्या हैं/i.test(raw)
  ) {
    scores.GENERAL_AGENT_INFO += 10;
  }

  // -------------------------------------------------------------
  // 8. ACTION_HISTORY SEMANTIC MATCHING
  // Covers: what happened during last irrigation, past actions, previous decisions,
  // water saved, simulation outcomes.
  // -------------------------------------------------------------
  if (
    /show (my )?last irrigation action/i.test(q) ||
    /what happened during (the )?last irrigation/i.test(q) ||
    /last irrigation action/i.test(q) ||
    /what was (my )?last irrigation/i.test(q) ||
    /previous (action|decision|simulation)/i.test(q) ||
    /past (action|decision|irrigation)/i.test(q) ||
    /action history/i.test(q) ||
    /did (the )?previous simulation succeed/i.test(q) ||
    /water saved|how much water (was )?saved/i.test(q)
  ) {
    scores.ACTION_HISTORY += 10;
  }

  // Multilingual ACTION_HISTORY
  if (
    /मागील कृती|मागची सिंचन कृती|मागील निर्णय|पाण्याची बचत|पूर्वीची कृती/i.test(raw) ||
    /पिछली कार्रवाई|पिछला सिंचाई एक्शन|पिछला निर्णय|जल बचत|पानी की बचत/i.test(raw)
  ) {
    scores.ACTION_HISTORY += 10;
  }

  // -------------------------------------------------------------
  // 9. MEMORY_QUERY SEMANTIC MATCHING
  // Covers: what do you remember, what do you know about my farm,
  // episodic memory, short-term memory, semantic memory.
  // -------------------------------------------------------------
  if (
    /what do you remember/i.test(q) ||
    /what do you know about my farm/i.test(q) ||
    /agent memory/i.test(q) ||
    /episodic memory/i.test(q) ||
    /semantic memory/i.test(q) ||
    /short[- ]term memory/i.test(q) ||
    /what happened in previous cycles/i.test(q)
  ) {
    scores.MEMORY_QUERY += 10;
  }

  // Multilingual MEMORY_QUERY
  if (
    /स्मृती|काय लक्षात आहे|माहिती साठा|स्मृती अहवाल/i.test(raw) ||
    /स्मृति|क्या याद है|पिछली जानकारी|याददाश्त/i.test(raw)
  ) {
    scores.MEMORY_QUERY += 10;
  }

  // -------------------------------------------------------------
  // 10. SIMULATION_ACTION SEMANTIC MATCHING
  // Covers: simulate irrigation, run monitoring cycle, trigger cycle.
  // -------------------------------------------------------------
  if (
    /simulate irrigation/i.test(q) ||
    /create an irrigation action/i.test(q) ||
    /run (the )?(next )?monitoring cycle/i.test(q) ||
    /trigger (monitoring )?cycle/i.test(q) ||
    /start simulation/i.test(q) ||
    /simulate \d+ minutes?/i.test(q)
  ) {
    scores.SIMULATION_ACTION += 10;
  }

  // Multilingual SIMULATION_ACTION
  if (
    /सिम्युलेशन चालवा|सायकल चालवा|सिंचन सायकल सुरू करा/i.test(raw) ||
    /सिमुलेशन चलाएं|सिंचाई सिमुलेट करें|साइकिल ट्रिगर करें/i.test(raw)
  ) {
    scores.SIMULATION_ACTION += 10;
  }

  // -------------------------------------------------------------
  // AMBIGUOUS CROP OBSERVATION CHECK (e.g. "My crop looks bad")
  // -------------------------------------------------------------
  if (
    /my (crop|plants?) (looks?|seems?) (bad|poor|unhealthy|weak)/i.test(q) ||
    /something is wrong with my (crop|plants?)/i.test(q)
  ) {
    return {
      intent: 'CROP_HEALTH',
      confidence: 0.88,
      entities,
      required_tools: INTENT_TOOL_MAPPING.CROP_HEALTH,
      needs_farm_data: true,
      needs_clarification: true,
      clarification_question:
        'To diagnose why your crop looks distressed, could you share more details: are leaves turning yellow, are there visible insect pests/spots, is the soil dry, or would you like to upload a photo to the Crop Health tab?',
    };
  }

  // -------------------------------------------------------------
  // EVALUATE SCORES & WINNING INTENT
  // -------------------------------------------------------------
  let maxIntent: UserIntent = 'UNKNOWN_OR_UNSUPPORTED';
  let maxScore = 0;

  for (const [intentKey, scoreVal] of Object.entries(scores)) {
    if (scoreVal > maxScore) {
      maxScore = scoreVal;
      maxIntent = intentKey as UserIntent;
    }
  }

  // Disambiguation Priority:
  // If CROP_HEALTH and SENSOR_ANALYSIS both fired:
  if (scores.CROP_HEALTH >= 6 && /healthy|health|stress|yellow/i.test(q)) {
    maxIntent = 'CROP_HEALTH';
  }

  // If IRRIGATION_DECISION and WEATHER_QUERY both fired:
  if (scores.IRRIGATION_DECISION >= 6 && /irrigate|water/i.test(q)) {
    maxIntent = 'IRRIGATION_DECISION';
  }

  // If FARM_STATUS and decision support fired:
  if (scores.FARM_STATUS >= 6) {
    maxIntent = 'FARM_STATUS';
  }

  if (maxScore >= 5) {
    const confidence = Math.min(0.96, Math.max(0.85, 0.85 + (maxScore - 5) * 0.02));
    const tools = INTENT_TOOL_MAPPING[maxIntent] || [];
    const needsFarmData =
      maxIntent !== 'GENERAL_AGENT_INFO' && maxIntent !== 'UNKNOWN_OR_UNSUPPORTED';

    return {
      intent: maxIntent,
      confidence,
      entities,
      required_tools: tools,
      needs_farm_data: needsFarmData,
      needs_clarification: false,
    };
  }

  // Conversational context capture (e.g. "My farm is in Thane", "Rice", "Vegetative")
  if (entities.crop && q.length < 30 && !q.includes('?')) {
    return {
      intent: 'UNKNOWN_OR_UNSUPPORTED',
      confidence: 0.85,
      entities,
      required_tools: [],
      needs_farm_data: false,
      needs_clarification: false,
      clarification_question: `Recorded crop as ${entities.crop}. What is its current growth stage or what would you like to analyze?`,
    };
  }

  // Genuine Out-of-Domain or Ambiguous Fallback
  return {
    intent: 'UNKNOWN_OR_UNSUPPORTED',
    confidence: 0.35,
    entities,
    required_tools: [],
    needs_farm_data: false,
    needs_clarification: true,
    clarification_question:
      'As AgroGenesis AI, I specialize in: Crop Health Analysis, Irrigation Decisions, Soil Nutrients & NPK, Weather Precautions, Farm Status, Sensor Telemetry, and Action History. How may I assist your farm today?',
  };
}

/**
 * Classify user intent using Gemini with structured JSON output,
 * with deterministic semantic fallback and validation guardrails.
 */
export async function classifyUserIntent(
  message: string,
  aiClient: GoogleGenAI | null,
  sessionContext?: { plotId?: string; crop?: string; growthStage?: string; location?: string }
): Promise<IntentClassificationResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    return classifyIntentDeterministically('', sessionContext);
  }

  // Always compute deterministic classification as reliable ground-truth baseline
  const deterministicBaseline = classifyIntentDeterministically(trimmed, sessionContext);

  // If Gemini is not configured, return deterministic result directly
  if (!aiClient) {
    return deterministicBaseline;
  }

  try {
    const prompt = `You are the intent classifier for AgroGenesis, an Indian precision agriculture autonomous AI agent.
Analyze the user message and categorize it into EXACTLY ONE of the allowed intents:
- GENERAL_AGENT_INFO: Questions about the agent's role, what it does, how it works, PEAS model, architecture, capabilities, limitations, difference between simulation and real sensor data. (DO NOT output farm telemetry).
- FARM_STATUS: Overall farm status summary, how the farm is doing, general farm conditions, analyzing farm conditions, identifying most important action or decision to take right now on the farm.
- SENSOR_ANALYSIS: Specific sensor queries (soil moisture value, sensor anomalies, what happens if a sensor stops working, temperature/humidity bounds).
- IRRIGATION_DECISION: Inquiries asking whether to irrigate, water requirements, water delay reasons, moisture stress vs rainfall lockouts.
- FERTILIZATION_ANALYSIS: Soil nutrients, NPK levels, fertilizer dosage, Soil Health Card requirements, KVK testing.
- CROP_HEALTH: Crop health diagnostics, factors affecting crop health or growth, signs of plant stress, stunted or poor growth, leaf yellowing, spots, disease symptoms, pest infestation, asking if crop is healthy based on telemetry.
- WEATHER_QUERY: Weather forecast, rain probability, monsoon condition, IMD gridded telemetry.
- ACTION_HISTORY: Past irrigation events, previous actuator decisions, simulation execution results, water saved.
- MEMORY_QUERY: Queries asking what the agent remembers, short-term/episodic/semantic memory, what happened in previous cycles.
- SIMULATION_ACTION: Explicit commands to simulate irrigation, run monitoring cycle, or test scenario.
- UNKNOWN_OR_UNSUPPORTED: Unrelated queries (outside agriculture/farming/agent), non-agricultural greetings, or meaningless strings.

User Message: "${trimmed}"
Current Session Context: Crop=${sessionContext?.crop || 'None'}, GrowthStage=${sessionContext?.growthStage || 'None'}, Location=${sessionContext?.location || 'None'}

Return ONLY valid JSON matching the intent schema.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: INTENT_SCHEMA,
        temperature: 0.1,
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text) as Partial<IntentClassificationResult>;
      if (parsed.intent && ALLOWED_INTENTS.includes(parsed.intent as UserIntent)) {
        const intent = parsed.intent as UserIntent;
        const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.9;

        // Intent Validation Guardrail:
        // If Gemini classified as UNKNOWN_OR_UNSUPPORTED or low confidence (< 0.65),
        // but our deterministic rule engine identified a valid agricultural intent (confidence >= 0.75),
        // override Gemini's false-negative classification!
        if (
          (intent === 'UNKNOWN_OR_UNSUPPORTED' || confidence < 0.65) &&
          deterministicBaseline.intent !== 'UNKNOWN_OR_UNSUPPORTED' &&
          deterministicBaseline.confidence >= 0.75
        ) {
          console.info(
            `[AgentIntentValidation] Overriding Gemini '${intent}' with deterministic '${deterministicBaseline.intent}' (confidence: ${deterministicBaseline.confidence})`
          );
          return deterministicBaseline;
        }

        return {
          intent,
          confidence,
          entities: {
            ...sessionContext,
            ...(parsed.entities || {}),
          },
          required_tools: INTENT_TOOL_MAPPING[intent] || [],
          needs_farm_data: parsed.needs_farm_data ?? (intent !== 'GENERAL_AGENT_INFO' && intent !== 'UNKNOWN_OR_UNSUPPORTED'),
          needs_clarification: parsed.needs_clarification ?? false,
          clarification_question: parsed.clarification_question,
        };
      }
    }
  } catch (err: any) {
    console.warn('[AgentIntentClassifier] Gemini classification unavailable, using deterministic classifier:', err?.message);
  }

  // Graceful fallback to deterministic rule engine
  return deterministicBaseline;
}
