import 'dotenv/config';
import { getLLMProvider, AIErrorClassifier } from '../src/lib/ai/providers';

async function testLiveOpenAI() {
  console.log('============== TESTING LIVE OPENAI API RESPONSE ==============\n');

  try {
    const llm = getLLMProvider();
    console.log('Sending test prompt to OpenAI model (gpt-4o-mini)...');
    const response = await llm.invoke('Hello, reply with "OpenAI is connected!"');
    console.log('✅ OPENAI SUCCESSFUL RESPONSE:', response.content);
  } catch (error: any) {
    console.log('❌ OPENAI ERROR CAUGHT:');
    console.log('   Raw Error Message:', error?.message);
    console.log('   Error Status Code:', error?.status || error?.response?.status || error?.code);

    const classified = AIErrorClassifier.classify(error);
    console.log('\n📊 AI Error Classifier Diagnosis:');
    console.log('   Code:', classified.code);
    console.log('   Is Retryable:', classified.isRetryable);
    console.log('   Customer Facing Message:', classified.customerMessage);
  }

  console.log('\n=============================================================');
}

testLiveOpenAI();
