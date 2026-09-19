import { classifyIntentDeterministically } from './intentClassifier';

interface TestCase {
  query: string;
  expectedIntent: string;
  minConfidence?: number;
}

const TEST_CASES: TestCase[] = [
  // 1. CROP_HEALTH queries
  {
    query: 'What factors are affecting the health of my crop right now?',
    expectedIntent: 'CROP_HEALTH',
  },
  {
    query: 'Why is my crop not growing well?',
    expectedIntent: 'CROP_HEALTH',
  },
  {
    query: 'Is my rice crop showing any signs of stress?',
    expectedIntent: 'CROP_HEALTH',
  },
  {
    query: 'Leaves are turning yellow with spots on my rice plants',
    expectedIntent: 'CROP_HEALTH',
  },
  {
    query: 'Check my plant health for fungal disease or blast',
    expectedIntent: 'CROP_HEALTH',
  },
  {
    query: 'What problems could be affecting my crop?',
    expectedIntent: 'CROP_HEALTH',
  },
  {
    query: 'पिकाचे आरोग्य कसे आहे?',
    expectedIntent: 'CROP_HEALTH',
  },
  {
    query: 'फसल का स्वास्थ्य कैसा है और पत्तियां पीली क्यों हो रही हैं?',
    expectedIntent: 'CROP_HEALTH',
  },

  // 2. GENERAL_AGENT_INFO queries
  {
    query: 'What is your role as an agriculture AI agent?',
    expectedIntent: 'GENERAL_AGENT_INFO',
  },
  {
    query: 'How does your agent work?',
    expectedIntent: 'GENERAL_AGENT_INFO',
  },
  {
    query: 'What is the difference between simulation and real sensor data?',
    expectedIntent: 'GENERAL_AGENT_INFO',
  },
  {
    query: 'What tools can you use?',
    expectedIntent: 'GENERAL_AGENT_INFO',
  },

  // 3. FARM_STATUS queries
  {
    query: 'What is the current condition of my farm?',
    expectedIntent: 'FARM_STATUS',
  },
  {
    query: 'Give me an overview of my current farm',
    expectedIntent: 'FARM_STATUS',
  },
  {
    query: 'How is my farm doing today?',
    expectedIntent: 'FARM_STATUS',
  },

  // 4. IRRIGATION_DECISION queries
  {
    query: 'Should I irrigate my rice crop right now?',
    expectedIntent: 'IRRIGATION_DECISION',
  },
  {
    query: 'Is it safe to irrigate before the monsoon rain?',
    expectedIntent: 'IRRIGATION_DECISION',
  },
  {
    query: 'Why did you recommend delaying irrigation?',
    expectedIntent: 'IRRIGATION_DECISION',
  },

  // 5. FERTILIZATION_ANALYSIS queries
  {
    query: 'What nutrients are missing in my soil?',
    expectedIntent: 'FERTILIZATION_ANALYSIS',
  },
  {
    query: 'Why do I need a soil test or Soil Health Card?',
    expectedIntent: 'FERTILIZATION_ANALYSIS',
  },
  {
    query: 'Should I apply urea or DAP fertilizer today?',
    expectedIntent: 'FERTILIZATION_ANALYSIS',
  },

  // 6. SENSOR_ANALYSIS queries
  {
    query: 'What is the current soil moisture reading?',
    expectedIntent: 'SENSOR_ANALYSIS',
  },
  {
    query: 'Are my sensors working properly?',
    expectedIntent: 'SENSOR_ANALYSIS',
  },
  {
    query: 'What happens if my soil sensor stops working?',
    expectedIntent: 'SENSOR_ANALYSIS',
  },

  // 7. WEATHER_QUERY queries
  {
    query: 'What is the weather at my farm?',
    expectedIntent: 'WEATHER_QUERY',
  },
  {
    query: 'What is the monsoon rainfall forecast for the next 24 hours?',
    expectedIntent: 'WEATHER_QUERY',
  },

  // 8. ACTION_HISTORY queries
  {
    query: 'What happened during the last irrigation?',
    expectedIntent: 'ACTION_HISTORY',
  },
  {
    query: 'How much water was saved in previous actions?',
    expectedIntent: 'ACTION_HISTORY',
  },

  // 9. MEMORY_QUERY queries
  {
    query: 'What do you remember about my farm?',
    expectedIntent: 'MEMORY_QUERY',
  },
  {
    query: 'What is in your episodic and semantic memory?',
    expectedIntent: 'MEMORY_QUERY',
  },

  // 10. SIMULATION_ACTION queries
  {
    query: 'Simulate irrigation on this plot for 20 minutes',
    expectedIntent: 'SIMULATION_ACTION',
  },
  {
    query: 'Run the next monitoring cycle',
    expectedIntent: 'SIMULATION_ACTION',
  },
];

console.log('--- RUNNING INTENT CLASSIFICATION SUITE ---');
let passed = 0;
let failed = 0;

for (const tc of TEST_CASES) {
  const result = classifyIntentDeterministically(tc.query, {
    plotId: 'plot-1',
    crop: 'Rice (Paddy)',
    growthStage: 'Tillering',
    location: 'Thane, Maharashtra',
  });

  const isMatch = result.intent === tc.expectedIntent;
  if (isMatch) {
    passed++;
    console.log(`[PASS] "${tc.query}" -> ${result.intent} (${(result.confidence * 100).toFixed(0)}%) [Tools: ${result.required_tools.join(', ') || 'None'}]`);
  } else {
    failed++;
    console.error(`[FAIL] "${tc.query}"\n       Expected: ${tc.expectedIntent}\n       Received: ${result.intent} (${result.confidence})`);
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed out of ${TEST_CASES.length} test cases.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All intent classification test cases PASSED successfully!');
}
