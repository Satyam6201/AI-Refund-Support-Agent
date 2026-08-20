import { HumanMessage } from '@langchain/core/messages';
import { refundAgentGraph } from './graph';
import { AgentLogService } from '@/services/agent-log.service';
import { AIErrorClassifier } from '@/lib/ai/providers';
import { ExecutionStatus, LogType } from '@prisma/client';

export interface RunAgentParams {
  userMessage: string;
  customerId?: string;
  orderId?: string;
  maxRetries?: number;
  recursionLimit?: number;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function runRefundAgentWorkflow(params: RunAgentParams) {
  const { userMessage, customerId, orderId, maxRetries = 3, recursionLimit = 15 } = params;

  const execution = await AgentLogService.createExecution(customerId || null, userMessage);
  const executionId = execution.id;

  await AgentLogService.addLog({
    executionId,
    step: 'Request Received',
    type: LogType.SYSTEM,
    message: `Received customer query: "${userMessage}"`,
    metadata: { customerId, orderId },
    event: 'REQUEST_RECEIVED',
  });

  await AgentLogService.addLog({
    executionId,
    step: 'Agent Started',
    type: LogType.SYSTEM,
    message: 'Initializing LangGraph agent workflow graph.',
    event: 'AGENT_STARTED',
  });

  let currentRetry = 0;

  while (currentRetry <= maxRetries) {
    try {
      if (currentRetry > 0) {
        const backoffMs = Math.pow(2, currentRetry - 1) * 300;
        await sleep(backoffMs);

        await AgentLogService.addLog({
          executionId,
          step: `Retry Attempt ${currentRetry}`,
          type: LogType.SYSTEM,
          message: `Retrying agent execution with backoff delay (${backoffMs}ms).`,
          event: 'RETRY',
        });
      }

      const initialState = {
        messages: [new HumanMessage(userMessage)],
        customerId,
        orderId,
        executionId,
        status: 'IN_PROGRESS' as const,
        retryCount: currentRetry,
      };

      const finalState = await refundAgentGraph.invoke(initialState, {
        recursionLimit,
      });

      const messages = finalState.messages;
      const lastMessage = messages[messages.length - 1];
      const responseText =
        typeof lastMessage?.content === 'string'
          ? lastMessage.content
          : JSON.stringify(lastMessage?.content || 'No response content generated.');

      const finalStatus =
        finalState.status === 'ESCALATED'
          ? ExecutionStatus.ESCALATED
          : ExecutionStatus.COMPLETED;

      await AgentLogService.updateExecutionStatus(executionId, finalStatus, responseText);

      await AgentLogService.addLog({
        executionId,
        step: 'Agent Completed',
        type: LogType.SYSTEM,
        message: 'Agent workflow completed decision successfully.',
        metadata: { finalStatus, responseText },
        event: finalStatus === ExecutionStatus.ESCALATED ? 'HUMAN_APPROVAL_REQUIRED' : 'AGENT_COMPLETED',
      });

      return {
        success: true,
        executionId,
        finalDecision: responseText,
        status: finalStatus,
        state: finalState,
      };
    } catch (error: unknown) {
      const errorObj = error as Error;
      const classified = AIErrorClassifier.classify(errorObj);

      await AgentLogService.addLog({
        executionId,
        step: 'AI Provider Error',
        type: LogType.ERROR,
        message: `AI Service Error (${classified.code}): ${classified.originalMessage}`,
        metadata: { code: classified.code, isRetryable: classified.isRetryable, attempt: currentRetry + 1 },
        event: 'TOOL_ERROR',
      });

      if (!classified.isRetryable || currentRetry >= maxRetries) {
        await AgentLogService.updateExecutionStatus(
          executionId,
          ExecutionStatus.FAILED,
          classified.customerMessage
        );

        await AgentLogService.addLog({
          executionId,
          step: 'Agent Failed',
          type: LogType.ERROR,
          message: `Execution terminated safely due to ${classified.code}. No refund was processed.`,
          metadata: { code: classified.code },
          event: 'AGENT_FAILED',
        });

        return {
          success: false,
          executionId,
          finalDecision: classified.customerMessage,
          status: ExecutionStatus.FAILED,
          error: classified.originalMessage,
          errorCode: classified.code,
        };
      }

      currentRetry++;
    }
  }

  const defaultFailMessage = "I'm temporarily unable to process your request because the AI service is unavailable. Please try again shortly.";
  await AgentLogService.updateExecutionStatus(executionId, ExecutionStatus.FAILED, defaultFailMessage);

  return {
    success: false,
    executionId,
    finalDecision: defaultFailMessage,
    status: ExecutionStatus.FAILED,
  };
}
