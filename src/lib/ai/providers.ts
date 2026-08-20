import { ChatOpenAI } from '@langchain/openai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export type AIErrorCode =
  | 'INVALID_API_KEY'
  | 'PROVIDER_QUOTA_EXHAUSTED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'PROVIDER_SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'SIMULATED_FAILURE'
  | 'UNKNOWN_ERROR';

export interface ClassifiedAIError {
  code: AIErrorCode;
  isRetryable: boolean;
  customerMessage: string;
  originalMessage: string;
  statusCode?: number;
}

export class AIErrorClassifier {
  public static classify(error: any): ClassifiedAIError {
    const message = error?.message || String(error || '');
    const status = error?.status || error?.response?.status || error?.code;

    if (message.includes('SIMULATED_AI_FAILURE') || process.env.SIMULATE_AI_FAILURE === 'true') {
      return {
        code: 'SIMULATED_AI_FAILURE' as any,
        isRetryable: false,
        customerMessage: "I'm temporarily unable to process your request because the AI service is unavailable. Please try again shortly.",
        originalMessage: 'Simulated AI failure for developer testing.',
        statusCode: 500,
      };
    }

    if (status === 401 || message.includes('401') || message.includes('Incorrect API key') || message.includes('invalid_api_key')) {
      return {
        code: 'INVALID_API_KEY',
        isRetryable: false,
        customerMessage: "I'm temporarily unable to process your request due to an AI authentication issue. Please try again shortly.",
        originalMessage: message,
        statusCode: 401,
      };
    }

    if (status === 429 || message.includes('429') || message.includes('quota') || message.includes('billing')) {
      const isQuotaExhausted = message.toLowerCase().includes('quota') || message.toLowerCase().includes('billing') || message.toLowerCase().includes('plan');
      return {
        code: isQuotaExhausted ? 'PROVIDER_QUOTA_EXHAUSTED' : 'RATE_LIMIT_EXCEEDED',
        isRetryable: !isQuotaExhausted,
        customerMessage: "I'm temporarily unable to process your request because the AI service is unavailable. Please try again shortly.",
        originalMessage: message,
        statusCode: 429,
      };
    }

    if (status >= 500 && status < 600) {
      return {
        code: 'PROVIDER_SERVER_ERROR',
        isRetryable: true,
        customerMessage: "I'm temporarily unable to process your request because the AI service is unavailable. Please try again shortly.",
        originalMessage: message,
        statusCode: status,
      };
    }

    if (message.includes('fetch failed') || message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT')) {
      return {
        code: 'NETWORK_ERROR',
        isRetryable: true,
        customerMessage: "Network connection error. Please try again shortly.",
        originalMessage: message,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      isRetryable: false,
      customerMessage: "I'm temporarily unable to process your request. Please try again shortly.",
      originalMessage: message,
    };
  }
}

export function validateOpenAIConfig(): { configured: boolean; model: string; keyPresent: boolean } {
  const apiKey = process.env.OPENAI_API_KEY;
  const keyPresent = !!apiKey && apiKey !== 'sk-placeholder-key-for-development' && apiKey.trim().length > 0;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  return {
    configured: keyPresent,
    model,
    keyPresent,
  };
}

export function getLLMProvider(): BaseChatModel {
  const config = validateOpenAIConfig();

  if (process.env.SIMULATE_AI_FAILURE === 'true') {
    throw new Error('SIMULATED_AI_FAILURE: Developer simulation toggle is active.');
  }

  const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const openAiKey = process.env.OPENAI_API_KEY || 'sk-placeholder-key-for-development';

  return new ChatOpenAI({
    modelName,
    temperature: 0,
    apiKey: openAiKey,
    maxRetries: 0,
  });
}
