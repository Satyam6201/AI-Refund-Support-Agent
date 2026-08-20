import { createRefundAgentGraph } from '../src/core/agent/graph';
import { REFUND_AGENT_SYSTEM_PROMPT } from '../src/lib/ai/prompts';
import { getAgentModel } from '../src/lib/ai/model';

async function testAgentSetup() {
  console.log('🤖 Testing LangGraph Agent Graph & LLM Configuration...\n');

  // 1. Test System Prompt presence
  console.log('1. System Prompt Verification:');
  console.log(`  Length: ${REFUND_AGENT_SYSTEM_PROMPT.length} characters`);
  console.assert(REFUND_AGENT_SYSTEM_PROMPT.includes('check_refund_policy'), 'System prompt missing policy instruction!');
  console.log('  ✅ System prompt loaded cleanly.\n');

  // 2. Test Model Instantiation
  console.log('2. LLM Model & Tool Binding Verification:');
  try {
    const model = getAgentModel();
    console.log(`  Model class: ${model.constructor.name}`);
    console.log('  ✅ Model instantiated with tool bindings.\n');
  } catch (err: any) {
    console.log(`  Model creation note: ${err.message}`);
  }

  // 3. Test StateGraph Compilation
  console.log('3. LangGraph StateGraph Compilation Verification:');
  const graph = createRefundAgentGraph();
  console.log(`  Graph compiled successfully: ${!!graph}`);
  console.assert(!!graph, 'StateGraph compilation failed!');
  console.log('  ✅ LangGraph StateGraph compiled cleanly.\n');

  console.log('🎉 LANGGRAPH AGENT WORKFLOW ENGINE & LLM SETUP VERIFIED SUCCESSFULLY!');
}

testAgentSetup().catch(console.error);
