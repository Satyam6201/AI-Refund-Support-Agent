import { Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { PolicyValidationResult } from '@/core/policy/policy-types';

export const RefundAgentStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  customerId: Annotation<string | undefined>(),
  orderId: Annotation<string | undefined>(),
  executionId: Annotation<string>(),
  policyResult: Annotation<PolicyValidationResult | undefined>(),
  status: Annotation<'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED' | 'FAILED'>({
    reducer: (x, y) => y ?? x,
    default: () => 'IN_PROGRESS',
  }),
  retryCount: Annotation<number>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => 0,
  }),
});

export type RefundAgentState = typeof RefundAgentStateAnnotation.State;
