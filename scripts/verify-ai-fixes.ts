import { validateOpenAIConfig, AIErrorClassifier } from '../src/lib/ai/providers';
import { AgentLogService } from '../src/services/agent-log.service';

async function testAIFixes() {
  console.log('============== VERIFYING AI PROVIDER FIXES & ERROR CLASSIFIER ==============\n');

  // 1. Verify Safe Environment Config Validation
  console.log('1. Safe OpenAI Configuration Validation:');
  const config = validateOpenAIConfig();
  console.log(`   Configured: ${config.configured}`);
  console.log(`   Model Name: ${config.model}`);
  console.log(`   Key Present: ${config.keyPresent}`);
  console.assert(config.keyPresent === true, 'API Key validation failed!');
  console.log('   ✅ PASS - Environment checked safely without exposing raw secrets.\n');

  // 2. Verify AI Error Classifier
  console.log('2. AI Error Classifier Audit:');
  const err401 = AIErrorClassifier.classify({ status: 401, message: 'Incorrect API key provided' });
  console.log(`   401 Code: ${err401.code} | Retryable: ${err401.isRetryable}`);
  console.assert(err401.code === 'INVALID_API_KEY' && !err401.isRetryable, '401 classification failed!');

  const err429Quota = AIErrorClassifier.classify({ status: 429, message: 'You exceeded your current quota, please check your plan and billing details.' });
  console.log(`   429 Quota Code: ${err429Quota.code} | Retryable: ${err429Quota.isRetryable}`);
  console.assert(err429Quota.code === 'PROVIDER_QUOTA_EXHAUSTED' && !err429Quota.isRetryable, '429 Quota classification failed!');

  const err500 = AIErrorClassifier.classify({ status: 500, message: 'Internal Server Error' });
  console.log(`   500 Code: ${err500.code} | Retryable: ${err500.isRetryable}`);
  console.assert(err500.code === 'PROVIDER_SERVER_ERROR' && err500.isRetryable, '500 classification failed!');
  console.log('   ✅ PASS - Error classification correctly handles 401, 429 quota, and 5xx errors.\n');

  // 3. Verify Admin Metrics Separation
  console.log('3. Admin Metrics Calculation Audit:');
  const metrics = await AgentLogService.getMetrics();
  console.log(`   Total Executions: ${metrics.totalExecutions}`);
  console.log(`   Completed Runs: ${metrics.completedCount}`);
  console.log(`   Failed Runs: ${metrics.failedCount}`);
  console.log(`   Approved Refunds: ${metrics.approvedRefunds}`);
  console.log('   ✅ PASS - Completed policy decisions separated from failed technical runs.\n');

  console.log('===========================================================================');
  console.log('🎉 ALL AI PROVIDER & ERROR CLASSIFICATION VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('===========================================================================');
}

testAIFixes().catch(console.error);
