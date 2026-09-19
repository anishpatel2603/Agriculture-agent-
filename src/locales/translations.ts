import { Language } from '../types';

export interface Translations {
  appName: string;
  appSubtitle: string;
  demoBadge: string;
  monsoonTracker: string;
  powerFeeder: string;
  language: string;
  units: string;
  acre: string;
  hectare: string;

  // Navigation tabs
  nav: {
    dashboard: string;
    plots: string;
    sensors: string;
    agent: string;
    irrigation: string;
    fertilization: string;
    cropHealth: string;
    alerts: string;
    history: string;
    scenarios: string;
    architecture: string;
    peas: string;
    settings: string;
    tools?: string;
    memory?: string;
    metrics?: string;
  };

  // Seasons
  seasons: {
    kharif: string;
    rabi: string;
    zaid: string;
    perennial: string;
  };

  // Weather & Monsoon
  weather: {
    temperature: string;
    humidity: string;
    rainPast24h: string;
    rainForecastNext24h: string;
    rainProb: string;
    wind: string;
    activeMonsoon: string;
    breakMonsoon: string;
    preMonsoon: string;
    postMonsoon: string;
    dryWinter: string;
    dataSource: string;
  };

  // Common UI actions
  actions: {
    approve: string;
    reject: string;
    explainAI: string;
    manualPulse: string;
    emergencyStop: string;
    loadScenario: string;
    acknowledge: string;
    resolve: string;
    save: string;
    cancel: string;
    edit: string;
    addPlot: string;
    askCopilot: string;
    injectSensor: string;
    runDiagnostic: string;
    uploadImage: string;
    resetDemo: string;
  };

  // Dashboard & Metrics
  dashboard: {
    farmOverview: string;
    stateAndDistrict: string;
    totalLand: string;
    monitoredPlots: string;
    waterSaved: string;
    activeAlerts: string;
    pendingDecisions: string;
    kvkAdvisory: string;
    quickScenarios: string;
    soilCondition: string;
    irrigationMethod: string;
    waterSource: string;
  };

  // Soil & Fertilization
  fertilization: {
    title: string;
    subtitle: string;
    shcCardHeader: string;
    enterShcData: string;
    zeroFabricationNote: string;
    organicCarbon: string;
    availableN: string;
    availableP: string;
    availableK: string;
    soilPh: string;
    testingLab: string;
    sampleId: string;
    indianFertilizersTitle: string;
    kvkRecommendation: string;
  };

  // Crop Health Vision
  cropHealth: {
    title: string;
    subtitle: string;
    uploadLeafPhoto: string;
    observations: string;
    possibleCauses: string;
    nextSteps: string;
    disclaimer: string;
    selectSample: string;
    diagnoseButton: string;
  };

  // Scenarios
  scenarios: {
    title: string;
    subtitle: string;
    injectButton: string;
    expectedAction: string;
    academicTakeaway: string;
  };

  fertilizationTitle?: string;
  plotsTitle?: string;
  scenariosTitle?: string;
  settingsTitle?: string;
  soilHealthCard?: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    appName: 'AgroGenesis',
    appSubtitle: 'Indian Agriculture Precision AI Agent',
    demoBadge: '🇮🇳 India Precision Edition',
    monsoonTracker: 'Monsoon Status',
    powerFeeder: 'Rural Feeder (3-Phase)',
    language: 'Language',
    units: 'Land Unit',
    acre: 'Acre (एकड़)',
    hectare: 'Hectare (हेक्टर)',
    fertilizationTitle: 'Indian Fertilization Engine & KVK Soil Health Card',
    plotsTitle: 'Farm Plot Management & Soil Health Profile',
    scenariosTitle: 'Indian Agro-Climatic Scenario Suite & Edge Case Benchmark',
    settingsTitle: 'AgroGenesis Farm Configuration & Hardware System Settings',
    soilHealthCard: 'KVK Soil Health Card',

    nav: {
      dashboard: 'Farmer Dashboard',
      plots: 'Farm Plots & Crops',
      sensors: 'Live Telemetry & Probes',
      agent: 'Agent Control Center',
      irrigation: 'Irrigation Decisions',
      fertilization: 'Fertilizers & Soil Health',
      cropHealth: 'Crop Health Vision',
      alerts: 'Anomalies & Alerts',
      history: 'Actuator Audit Trail',
      scenarios: 'Indian Benchmark Tests',
      architecture: 'System Architecture',
      peas: 'Academic PEAS Model',
      settings: 'IoT HAL & Indian Sources',
      tools: 'Tool Registry & Workbench',
      memory: 'Agent Memory Inspector',
      metrics: 'Agent Performance Metrics',
    },

    seasons: {
      kharif: 'Kharif Season (खरीफ / पावसाळी)',
      rabi: 'Rabi Season (रबी / हिवाळी)',
      zaid: 'Zaid Season (जायद / उन्हाळी)',
      perennial: 'Perennial (बारमाही / बहुवर्षीय)',
    },

    weather: {
      temperature: 'Ambient Temp',
      humidity: 'Relative Humidity',
      rainPast24h: 'Past 24h Rainfall',
      rainForecastNext24h: '24h Rain Forecast',
      rainProb: 'Precipitation Probability',
      wind: 'Wind Speed',
      activeMonsoon: 'Active Monsoon Flow',
      breakMonsoon: 'Break-Monsoon Period',
      preMonsoon: 'Pre-Monsoon Showers',
      postMonsoon: 'Retreating Monsoon',
      dryWinter: 'Dry Winter Season',
      dataSource: 'Source: IMD AWS / AgroGenesis Microclimate Sim',
    },

    actions: {
      approve: 'Approve & Execute',
      reject: 'Reject Decision',
      explainAI: 'Explain with Gemini AI',
      manualPulse: 'Manual Irrigation Pulse',
      emergencyStop: 'Emergency Valve Stop',
      loadScenario: 'Inject & Run Scenario',
      acknowledge: 'Acknowledge',
      resolve: 'Mark Resolved',
      save: 'Save Plot Details',
      cancel: 'Cancel',
      edit: 'Edit Parameters',
      addPlot: '+ Add New Indian Farm Plot',
      askCopilot: 'Ask AgroGenesis Copilot',
      injectSensor: 'Inject Sensor Telemetry',
      runDiagnostic: 'Diagnose Leaf Symptoms',
      uploadImage: 'Upload Leaf Image',
      resetDemo: 'Reset Demo Baseline',
    },

    dashboard: {
      farmOverview: 'Indian Farm Overview',
      stateAndDistrict: 'Location Context',
      totalLand: 'Total Cultivated Land',
      monitoredPlots: 'Monitored Plots',
      waterSaved: 'Estimated Water Saved',
      activeAlerts: 'Active Warnings',
      pendingDecisions: 'Decisions Awaiting Approval',
      kvkAdvisory: 'Local KVK & IMD Advisory Context',
      quickScenarios: 'Quick Indian Test Scenarios',
      soilCondition: 'Soil Profile & Moisture',
      irrigationMethod: 'Irrigation System',
      waterSource: 'Water Source',
    },

    fertilization: {
      title: 'Indian Soil Chemistry & Fertilizer Management',
      subtitle: 'NPK balancing, Indian fertilizer formulations (Urea, DAP, MOP, SSP), and Soil Health Card integration.',
      shcCardHeader: 'Government Soil Health Card (SHC) Parameters',
      enterShcData: 'Enter Official Laboratory Test Readings',
      zeroFabricationNote: 'Zero-Fabrication Guardrail: If soil test values are missing, the agent strictly avoids prescribing synthetic chemical doses and recommends submitting a sample to the nearest Krishi Vigyan Kendra (KVK).',
      organicCarbon: 'Organic Carbon (OC %)',
      availableN: 'Available Nitrogen (N kg/ha)',
      availableP: 'Available Phosphorus (P₂O₅ kg/ha)',
      availableK: 'Available Potassium (K₂O kg/ha)',
      soilPh: 'Soil pH Reaction',
      testingLab: 'Authorized Testing Laboratory',
      sampleId: 'SHC Sample / Grid ID',
      indianFertilizersTitle: 'Standard Indian Fertilizers & Organic Manures',
      kvkRecommendation: 'Krishi Vigyan Kendra (KVK) Advisory Protocol',
    },

    cropHealth: {
      title: 'Indian Crop Health Vision Diagnostic',
      subtitle: 'Multi-modal diagnostic using Gemini 3.8 Flash for Indian agricultural diseases, insect pests, and nutrient chlorosis.',
      uploadLeafPhoto: 'Upload Field Leaf Photograph or Select Indian Benchmark Sample',
      observations: 'Key Visual Observations',
      possibleCauses: 'Differential Diagnosis & Possible Causes',
      nextSteps: 'Integrated Pest Management (IPM) & Next Steps',
      disclaimer: 'Agronomic Disclaimer: Optical analysis is advisory and non-destructive. Always verify with local agricultural extension officers before applying scheduled crop protection.',
      selectSample: 'Select Standard Indian Field Sample:',
      diagnoseButton: 'Analyze Foliage with Gemini AI',
    },

    scenarios: {
      title: 'Indian Agricultural Benchmark Scenarios',
      subtitle: '7 verified laboratory test cases reflecting Maharashtra Kharif Rice, Punjab Wheat, Vidarbha Cotton, and Rajasthan Rainfed farming.',
      injectButton: 'Inject Scenario Conditions',
      expectedAction: 'Expected Agronomic Decision',
      academicTakeaway: 'Academic & Pedagogical Takeaway',
    },
  },

  hi: {
    appName: 'एग्रोजेनेसिस (AgroGenesis)',
    appSubtitle: 'भारतीय सटीक कृषि एआई एजेंट',
    demoBadge: '🇮🇳 भारत विशेष संस्करण',
    monsoonTracker: 'मानसून स्थिति',
    powerFeeder: 'ग्रामीण कृषि फीडर (3-फेज)',
    language: 'भाषा',
    units: 'भूमि इकाई',
    acre: 'एकड़',
    hectare: 'हेक्टेयर',
    fertilizationTitle: 'भारतीय उर्वरक इंजन एवं केवीके मृदा स्वास्थ्य कार्ड',
    plotsTitle: 'खेत प्लॉट प्रबंधन एवं मृदा प्रोफाइल',
    scenariosTitle: 'भारतीय कृषि जलवायु परीक्षण परिदृश्य एवं बेंचमार्क',
    settingsTitle: 'एग्रोजेनेसिस खेत विन्यास एवं हार्डवेयर सिस्टम सेटिंग्स',
    soilHealthCard: 'केवीके मृदा स्वास्थ्य कार्ड',

    nav: {
      dashboard: 'किसान डैशबोर्ड',
      plots: 'खेत प्लॉट एवं फसलें',
      sensors: 'लाइव सेंसर एवं प्रोब',
      agent: 'एजेंट नियंत्रण केंद्र',
      irrigation: 'सिंचाई निर्णय एवं सलाह',
      fertilization: 'खाद एवं मृदा स्वास्थ्य (SHC)',
      cropHealth: 'फसल स्वास्थ्य निदान',
      alerts: 'चेतावनियां एवं अलर्ट',
      history: 'सिंचाई क्रिया लॉग',
      scenarios: 'भारतीय परीक्षण परिदृश्य',
      architecture: 'सिस्टम वास्तुकला',
      peas: 'शैक्षणिक PEAS मॉडल',
      settings: 'IoT एवं भारतीय स्रोत',
      tools: 'टूल रजिस्ट्री एवं वर्कबेंच',
      memory: 'एजेंट मेमरी इंस्पेक्टर',
      metrics: 'एजेंट परफॉर्मेंस मेट्रिक्स',
    },

    seasons: {
      kharif: 'खरीफ मौसम (मानसून)',
      rabi: 'रबी मौसम (शीतकालीन)',
      zaid: 'जायद मौसम (ग्रीष्मकालीन)',
      perennial: 'बारहमासी / बहुवर्षीय',
    },

    weather: {
      temperature: 'तापमान',
      humidity: 'आपेक्षिक आर्द्रता',
      rainPast24h: 'विगत २४ घंटे की वर्षा',
      rainForecastNext24h: 'आगामी वर्षा पूर्वानुमान',
      rainProb: 'वर्षा की संभावना',
      wind: 'हवा की गति',
      activeMonsoon: 'सक्रिय दक्षिण-पश्चिम मानसून',
      breakMonsoon: 'मानसून विराम काल',
      preMonsoon: 'मानसून पूर्व वर्षा',
      postMonsoon: 'मानसून वापसी काल',
      dryWinter: 'शुष्क शीत ऋतु',
      dataSource: 'स्रोत: भारत मौसम विज्ञान विभाग (IMD AWS सिमुलेशन)',
    },

    actions: {
      approve: 'स्वीकृत करें एवं चलाएं',
      reject: 'निर्णय अस्वीकार करें',
      explainAI: 'जेमिनी AI से समझें',
      manualPulse: 'मैनुअल सिंचाई शुरू करें',
      emergencyStop: 'आपातकालीन वाल्व बंद करें',
      loadScenario: 'परिदृश्य लोड एवं टेस्ट करें',
      acknowledge: 'स्वीकार किया',
      resolve: 'समाधान चिन्हित करें',
      save: 'प्लॉट विवरण सहेजें',
      cancel: 'रद्द करें',
      edit: 'संशोधित करें',
      addPlot: '+ नया खेत प्लॉट जोड़ें',
      askCopilot: 'कृषि सहायक से पूछें',
      injectSensor: 'सेंसर रीडिंग दर्ज करें',
      runDiagnostic: 'पत्ती रोग की जांच करें',
      uploadImage: 'पत्ती का फोटो अपलोड करें',
      resetDemo: 'डेमो रीसेट करें',
    },

    dashboard: {
      farmOverview: 'भारतीय खेत का विवरण',
      stateAndDistrict: 'राज्य एवं जिला स्थान',
      totalLand: 'कुल कृषि भूमि',
      monitoredPlots: 'निगरानी वाले प्लॉट',
      waterSaved: 'बचाया गया पानी (लीटर)',
      activeAlerts: 'सक्रिय चेतावनियां',
      pendingDecisions: 'लंबित सिंचाई निर्णय',
      kvkAdvisory: 'कृषि विज्ञान केंद्र (KVK) एवं मौसम सलाह',
      quickScenarios: 'शीघ्र भारतीय परीक्षण परिदृश्य',
      soilCondition: 'मिट्टी का प्रकार एवं नमी',
      irrigationMethod: 'सिंचाई प्रणाली',
      waterSource: 'जल स्रोत',
    },

    fertilization: {
      title: 'भारतीय मृदा रसायन एवं खाद प्रबंधन',
      subtitle: 'एनपीके संतुलन, भारतीय उर्वरक (यूरिया, डीएपी, पोटाश) एवं सॉइल हेल्थ कार्ड एकीकरण।',
      shcCardHeader: 'सरकारी मृदा स्वास्थ्य कार्ड (Soil Health Card) विवरण',
      enterShcData: 'आधिकारिक प्रयोगशाला परीक्षण आंकड़े दर्ज करें',
      zeroFabricationNote: 'शून्य-मनगढ़ंत सुरक्षा नियम: यदि मिट्टी परीक्षण आंकड़े उपलब्ध नहीं हैं, तो एजेंट रासायनिक खाद की मनमानी खुराक नहीं देता है और नजदीकी कृषि विज्ञान केंद्र (KVK) में मिट्टी जांच की सलाह देता है।',
      organicCarbon: 'जैविक कार्बन (OC %)',
      availableN: 'उपलब्ध नाइट्रोजन (N किग्रा/हेक्टेयर)',
      availableP: 'उपलब्ध फास्फोरस (P₂O₅ किग्रा/हेक्टेयर)',
      availableK: 'उपलब्ध पोटाश (K₂O किग्रा/हेक्टेयर)',
      soilPh: 'मृदा पीएच (pH)',
      testingLab: 'प्रमाणित मृदा परीक्षण प्रयोगशाला',
      sampleId: 'नमूना पहचान संख्या (Sample ID)',
      indianFertilizersTitle: 'प्रमुख भारतीय उर्वरक एवं जैविक खाद',
      kvkRecommendation: 'कृषि विज्ञान केंद्र (KVK) अनुशंसित खुराक',
    },

    cropHealth: {
      title: 'भारतीय फसल स्वास्थ्य एवं कीट निदान',
      subtitle: 'जेमिनी 3.8 फ्लैश विजन द्वारा भारतीय फसलों के रोगों, कीटों और पोषण की कमी का वैज्ञानिक विश्लेषण।',
      uploadLeafPhoto: 'खेत की पत्ती का फोटो अपलोड करें या भारतीय नमूना चुनें',
      observations: 'मुख्य दृश्य लक्षण',
      possibleCauses: 'संभावित कारण एवं रोग',
      nextSteps: 'एकीकृत कीट प्रबंधन (IPM) एवं उपाय',
      disclaimer: 'कृषि परामर्श अस्वीकरण: यह दृश्य विश्लेषण केवल सूचनात्मक है। कोई भी कीटनाशक डालने से पहले स्थानीय कृषि अधिकारी से सलाह लें।',
      selectSample: 'भारतीय मानक फसल नमूना चुनें:',
      diagnoseButton: 'जेमिनी AI से पत्ती का विश्लेषण करें',
    },

    scenarios: {
      title: 'भारतीय कृषि परीक्षण परिदृश्य (7 बेंचमार्क)',
      subtitle: 'महाराष्ट्र खरीफ धान, पंजाब गेहूं, विदर्भ कपास और राजस्थान शुष्क खेती के सत्यापित परीक्षण परिदृश्य।',
      injectButton: 'परिदृश्य स्थिति लागू करें',
      expectedAction: 'अपेक्षित कृषि निर्णय',
      academicTakeaway: 'शैक्षणिक एवं तकनीकी निष्कर्ष',
    },
  },

  mr: {
    appName: 'ऍग्रोजेनेसिस (AgroGenesis)',
    appSubtitle: 'भारतीय अचूक शेती कृत्रिम बुद्धिमत्ता (AI) सहाय्यक',
    demoBadge: '🇮🇳 भारत विशेष आवृत्ती',
    monsoonTracker: 'मान्सून स्थिती',
    powerFeeder: 'ग्रामीण कृषी फिडर (३-फेज वीज)',
    language: 'भाषा',
    units: 'जमीन परिमाण',
    acre: 'एकर',
    hectare: 'हेक्टर',
    fertilizationTitle: 'भारतीय खत व्यवस्थापन आणि केव्हीके मृदा आरोग्य पत्रिका',
    plotsTitle: 'शेत प्लॉट व्यवस्थापन आणि माती परीक्षण प्रोफाइल',
    scenariosTitle: 'भारतीय कृषी हवामान प्रात्यक्षिक चाचण्या आणि बेंचमार्क',
    settingsTitle: 'अ‍ॅग्रोजेनेसिस शेत रचना आणि हार्डवेअर प्रणाली सेटिंग्स',
    soilHealthCard: 'केव्हीके मृदा आरोग्य पत्रिका',

    nav: {
      dashboard: 'शेतकरी डॅशबोर्ड',
      plots: 'शेतातील प्लॉट आणि पिके',
      sensors: 'थेट सेन्सर व आकडेवारी',
      agent: 'एजंट नियंत्रण केंद्र',
      irrigation: 'पाणी नियोजन व निर्णय',
      fertilization: 'खत व्यवस्थापन व मृदा पत्रिका',
      cropHealth: 'पीक आरोग्य व रोग निदान',
      alerts: 'धोका इशारे व सतर्कता',
      history: 'सिंचन कृती इतिहास',
      scenarios: 'भारतीय प्रात्यक्षिक प्रसंग',
      architecture: 'प्रणालीची रचना (Architecture)',
      peas: 'शैक्षणिक PEAS मॉडेल',
      settings: 'IoT आणि भारतीय डेटा स्रोत',
      tools: 'टूल रजिस्ट्री आणि वर्कबेंच',
      memory: 'एजंट मेमरी तपासणी',
      metrics: 'एजंट कामगिरी मेट्रिक्स',
    },

    seasons: {
      kharif: 'खरीप हंगाम (पावसाळी)',
      rabi: 'रब्बी हंगाम (हिवाळी)',
      zaid: 'उन्हाळी हंगाम (जायद)',
      perennial: 'बारमाही पिके',
    },

    weather: {
      temperature: 'तापमान',
      humidity: 'हवेतील आर्द्रता',
      rainPast24h: 'मागील २४ तासांतील पाऊस',
      rainForecastNext24h: 'पुढील २४ तासांचा अंदाज',
      rainProb: 'पावसाची शक्यता',
      wind: 'वाऱ्याचा वेग',
      activeMonsoon: 'सक्रिय नैऋत्य मान्सून',
      breakMonsoon: 'मान्सूनचा खंड (विराम)',
      preMonsoon: 'मान्सूनपूर्व वळीवाचा पाऊस',
      postMonsoon: 'परतीचा पाऊस',
      dryWinter: 'कोरडा हिवाळा',
      dataSource: 'स्रोत: भारतीय हवामान विभाग (IMD AWS सिम्युलेशन)',
    },

    actions: {
      approve: 'मंजूर करा व सिंचन सुरू करा',
      reject: 'निर्णय नाकारा',
      explainAI: 'जेमिनी AI द्वारे कारण समजून घ्या',
      manualPulse: 'मॅन्युअल पाणी सुरू करा',
      emergencyStop: 'तातडीने व्हॉल्व बंद करा',
      loadScenario: 'प्रसंग लोड व चाचणी करा',
      acknowledge: 'पाहिले / मान्य केले',
      resolve: 'निवारण झाले',
      save: 'प्लॉटची माहिती जतन करा',
      cancel: 'रद्द करा',
      edit: 'बदल करा',
      addPlot: '+ नवीन शेत प्लॉट जोडा',
      askCopilot: 'कृषी AI मित्राला विचारा',
      injectSensor: 'सेन्सर रीडिंग टाका',
      runDiagnostic: 'पानावरील रोगाची तपासणी करा',
      uploadImage: 'पानाचा फोटो अपलोड करा',
      resetDemo: 'डेमो रीसेट करा',
    },

    dashboard: {
      farmOverview: 'भारतीय शेताचा तपशील',
      stateAndDistrict: 'राज्य व जिल्हा स्थान',
      totalLand: 'एकूण लागवड क्षेत्र',
      monitoredPlots: 'निरीक्षणाखालील प्लॉट्स',
      waterSaved: 'पाण्याची अंदाजित बचत (लिटर)',
      activeAlerts: 'सक्रिय इशारे',
      pendingDecisions: 'मंजुरीसाठी प्रलंबित निर्णय',
      kvkAdvisory: 'कृषी विज्ञान केंद्र (KVK) व हवामान सल्ला',
      quickScenarios: 'द्रुत भारतीय चाचणी प्रसंग',
      soilCondition: 'मातीचा प्रकार व ओलावा',
      irrigationMethod: 'सिंचन पद्धत',
      waterSource: 'पाण्याचा स्रोत',
    },

    fertilization: {
      title: 'भारतीय मृदा रसायनशास्त्र व खत व्यवस्थापन',
      subtitle: 'एनपीके संतुलन, भारतीय रासायनिक खते (युरिया, डीएपी, पोटॅश) आणि मृदा आरोग्य पत्रिका (Soil Health Card).',
      shcCardHeader: 'शासकीय मृदा आरोग्य पत्रिका (Soil Health Card) नोंदी',
      enterShcData: 'अधिकृत प्रयोगशाळा तपासणी आकडे भरा',
      zeroFabricationNote: 'अचूकतेचा नियम (Zero-Fabrication): माती तपासणी अहवाल उपलब्ध नसल्यास, प्रणाली मनमानी रासायनिक खतांची मात्रा सुचवत नाही. जवळच्या कृषी विज्ञान केंद्रात (KVK) माती परीक्षण करण्याचा सल्ला दिला जातो.',
      organicCarbon: 'सेंद्रिय कर्ब (OC %)',
      availableN: 'उपलब्ध नत्र (N किलो/हेक्टर)',
      availableP: 'उपलब्ध स्फुरद (P₂O₅ किलो/हेक्टर)',
      availableK: 'उपलब्ध पालाश (K₂O किलो/हेक्टर)',
      soilPh: 'सामू (pH)',
      testingLab: 'अधिकृत माती परीक्षण प्रयोगशाळा',
      sampleId: 'नमुना ओळख क्रमांक (Sample ID)',
      indianFertilizersTitle: 'प्रमुख भारतीय खते व सेंद्रिय शेणखत',
      kvkRecommendation: 'कृषी विद्यापीठ / KVK शिफारशीत मात्रा',
    },

    cropHealth: {
      title: 'भारतीय पीक आरोग्य व कीड-रोग तपासणी',
      subtitle: 'जेमिनी 3.8 फ्लॅश विजन द्वारे भारतीय पिकांवरील रोग, कीड आणि अन्नद्रव्य कमतरतेचे शास्त्रीय निदान.',
      uploadLeafPhoto: 'शेतातील पानाचा फोटो अपलोड करा किंवा भारतीय नमुना निवडा',
      observations: 'मुख्य दृश्य लक्षणे',
      possibleCauses: 'संभाव्य कारणे व रोग',
      nextSteps: 'एकीकृत कीड व्यवस्थापन (IPM) व उपाययोजना',
      disclaimer: 'कृषी सल्ला अस्वीकरण: हे दृश्य निदान मार्गदर्शक स्वरूपाचे आहे. फवारणीपूर्वी स्थानिक कृषी सहाय्यक किंवा तज्ञांचा सल्ला अवश्य घ्या.',
      selectSample: 'भारतीय मानक पीक नमुना निवडा:',
      diagnoseButton: 'जेमिनी AI द्वारे पाTanची तपासणी करा',
    },

    scenarios: {
      title: 'भारतीय कृषी चाचणी प्रसंग (७ बेंचमार्क)',
      subtitle: 'महाराष्ट्र खरीप भात, पंजाब गहू, विदर्भ कापूस आणि राजस्थान कोरडवाहू शेतीचे प्रात्यक्षिक प्रसंग.',
      injectButton: 'प्रसंग शेतात लागू करा',
      expectedAction: 'अपेक्षित कृषी निर्णय',
      academicTakeaway: 'शैक्षणिक व तांत्रिक निष्कर्ष',
    },
  },
};
