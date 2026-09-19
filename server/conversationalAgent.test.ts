import { orchestrateConversationalResponse } from './conversationalAgent';
import { FarmStore } from './farmStore';

async function runEndToEndVerification() {
  console.log('--- RUNNING END-TO-END CONVERSATIONAL AGENT VERIFICATION ---');
  const store = new FarmStore();

  const userQuestion = 'What factors are affecting the health of my crop right now?';
  console.log(`User Question: "${userQuestion}"`);

  const response = await orchestrateConversationalResponse(
    {
      message: userQuestion,
      language: 'en',
    },
    store
  );

  console.log(`\nAgent Intent: ${response.intent} (Confidence: ${response.intentConfidence})`);
  console.log(`Tools Used: ${response.toolsUsed.join(', ')}`);
  console.log(`Data Source: ${response.dataSource}`);
  console.log(`Reply Preview:\n${response.reply.substring(0, 300)}...\n`);

  if (response.intent !== 'CROP_HEALTH') {
    console.error(`FAILED: Expected CROP_HEALTH, got ${response.intent}`);
    process.exit(1);
  }

  if (!response.toolsUsed.includes('analyzeCropHealth')) {
    console.error('FAILED: Expected analyzeCropHealth tool to be executed');
    process.exit(1);
  }

  store.stopAgentLoop();
  console.log('SUCCESS: Conversational Agent correctly classified and handled CROP_HEALTH inquiry!');
  process.exit(0);
}

runEndToEndVerification().catch((err) => {
  console.error('Error during end-to-end verification:', err);
  process.exit(1);
});
