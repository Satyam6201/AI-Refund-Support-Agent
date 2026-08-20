import { StateGraph, END, START } from '@langchain/langgraph';
import { SystemMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import { RefundAgentStateAnnotation, RefundAgentState } from './state';
import { getAgentModel } from '@/lib/ai/model';
import { REFUND_AGENT_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { agentTools } from '@/core/tools';
import { AgentLogService } from '@/services/agent-log.service';
import { LogType } from '@prisma/client';

const toolsByNameMap: Record<string, unknown> = {};
for (const t of agentTools) {
  toolsByNameMap[t.name] = t;
}

async function agentNode(state: RefundAgentState): Promise<Partial<RefundAgentState>> {
  const model = getAgentModel();
  const systemMessage = new SystemMessage(REFUND_AGENT_SYSTEM_PROMPT);
  const fullMessages = [systemMessage, ...state.messages];

  if (state.executionId) {
    await AgentLogService.addLog({
      executionId: state.executionId,
      step: 'Understand Customer Request',
      type: LogType.REASONING,
      message: 'Agent evaluating query and determining required tools or response.',
    });
  }

  const response = await model.invoke(fullMessages);
  return {
    messages: [response],
  };
}

async function toolsNode(state: RefundAgentState): Promise<Partial<RefundAgentState>> {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  const toolCalls = lastMessage.tool_calls || [];
  const newMessages: ToolMessage[] = [];

  let extractedCustomerId = state.customerId;
  let extractedOrderId = state.orderId;
  let extractedPolicyResult = state.policyResult;
  let nextStatus = state.status;

  for (const call of toolCalls) {
    const targetTool = toolsByNameMap[call.name] as { invoke: (args: unknown) => Promise<string> } | undefined;
    if (!targetTool) {
      const errorMsg = `Tool '${call.name}' is not recognized.`;
      if (state.executionId) {
        await AgentLogService.addLog({
          executionId: state.executionId,
          step: 'Tool Error',
          type: LogType.ERROR,
          message: errorMsg,
        });
      }
      newMessages.push(
        new ToolMessage({
          content: JSON.stringify({ success: false, error: errorMsg }),
          tool_call_id: call.id || call.name,
        })
      );
      continue;
    }

    let stepName = `Tool: ${call.name}`;
    let logType: LogType = LogType.TOOL_CALL;

    if (call.name === 'get_customer') stepName = 'Customer Lookup';
    else if (call.name === 'get_order') stepName = 'Order Lookup';
    else if (call.name === 'check_refund_policy') {
      stepName = 'Policy Validation';
      logType = LogType.POLICY_CHECK;
    } else if (call.name === 'process_refund') stepName = 'Refund Processing';

    if (state.executionId) {
      await AgentLogService.addLog({
        executionId: state.executionId,
        step: stepName,
        type: logType,
        message: `Executing tool '${call.name}' with input arguments.`,
        metadata: call.args,
      });
    }

    let toolResultString: string;
    try {
      toolResultString = await targetTool.invoke(call.args);
    } catch (err: unknown) {
      const errorObj = err as Error;
      toolResultString = JSON.stringify({ success: false, error: errorObj.message || 'Tool execution error' });
    }

    try {
      const parsed = JSON.parse(toolResultString);

      if (call.name === 'get_customer' && parsed.success && parsed.customer) {
        extractedCustomerId = parsed.customer.id;
      }
      if (call.name === 'get_order' && parsed.success && parsed.order) {
        extractedOrderId = parsed.order.id;
        if (!extractedCustomerId) extractedCustomerId = parsed.order.customerId;
      }
      if (call.name === 'check_refund_policy' && parsed.success) {
        extractedPolicyResult = parsed;
        if (parsed.requiresHumanApproval) {
          nextStatus = 'ESCALATED';
        }
      }
      if (call.name === 'process_refund' && parsed.success) {
        nextStatus = parsed.requiresHumanApproval ? 'ESCALATED' : 'COMPLETED';
      }

      if (state.executionId) {
        await AgentLogService.addLog({
          executionId: state.executionId,
          step: `${stepName} Result`,
          type: LogType.TOOL_RESULT,
          message: parsed.success ? `Tool '${call.name}' completed successfully.` : `Tool '${call.name}' returned an error response.`,
          metadata: parsed,
        });
      }
    } catch {
    }

    newMessages.push(
      new ToolMessage({
        content: toolResultString,
        tool_call_id: call.id || call.name,
      })
    );
  }

  return {
    messages: newMessages,
    customerId: extractedCustomerId,
    orderId: extractedOrderId,
    policyResult: extractedPolicyResult,
    status: nextStatus,
  };
}

function shouldContinue(state: RefundAgentState): string {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  if (lastMessage && lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return 'tools';
  }
  return END;
}

export function createRefundAgentGraph() {
  const workflow = new StateGraph(RefundAgentStateAnnotation)
    .addNode('agent', agentNode)
    .addNode('tools', toolsNode)
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', shouldContinue, {
      tools: 'tools',
      [END]: END,
    })
    .addEdge('tools', 'agent');

  return workflow.compile();
}

export const refundAgentGraph = createRefundAgentGraph();
