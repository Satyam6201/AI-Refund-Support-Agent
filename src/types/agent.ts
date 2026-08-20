import { z } from 'zod';

export const ExecutionStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'ESCALATED']);
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

export const LogTypeSchema = z.enum(['TOOL_CALL', 'TOOL_RESULT', 'POLICY_CHECK', 'REASONING', 'SYSTEM', 'ERROR']);
export type LogType = z.infer<typeof LogTypeSchema>;

export const AgentLogSchema = z.object({
  id: z.string(),
  executionId: z.string(),
  step: z.string(),
  type: LogTypeSchema,
  message: z.string(),
  metadata: z.record(z.any()).nullable(),
  timestamp: z.date(),
});

export type AgentLog = z.infer<typeof AgentLogSchema>;

export const AgentExecutionSchema = z.object({
  id: z.string(),
  customerId: z.string().nullable(),
  userMessage: z.string(),
  status: ExecutionStatusSchema,
  finalDecision: z.string().nullable(),
  startedAt: z.date(),
  completedAt: z.date().nullable(),
});

export type AgentExecution = z.infer<typeof AgentExecutionSchema>;
