import { getLLMProvider } from './providers';
import { agentTools } from '@/core/tools';
import { ChatOpenAI } from '@langchain/openai';

export function getAgentModel() {
  const llm = getLLMProvider();
  return (llm as ChatOpenAI).bindTools(agentTools);
}
