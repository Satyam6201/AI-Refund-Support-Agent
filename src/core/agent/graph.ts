import { StateGraph, END, START } from '@langchain/langgraph';
import { SystemMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import { RefundAgentStateAnnotation, RefundAgentState } from './state';
import { getAgentModel } from '@/lib/ai/model';
import { REFUND_AGENT_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { agentTools } from '@/core/tools';
import { AgentLogService } from '@/services/agent-log.service';
import { LogType } from '@prisma/client';

// Map of tools by name for instant execution
const toolsByNameMap: Record<string, any> = {};
for (const t of agentTools) {
  toolsByNameMap[t.name] = t;
}

/**
 * Node 1: Agent Reasoning & LLM Call Node
 */
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

/**
 * Node 2: Tool Execution & Logging Node
 */
async function toolsNode(state: RefundAgentState): Promise<Partial<RefundAgentState>> {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  const toolCalls = lastMessage.tool_calls || [];
  const newMessages: ToolMessage[] = [];

  let extractedCustomerId = state.customerId;
  let extractedOrderId = state.orderId;
  let extractedPolicyResult = state.policyResult;
  let nextStatus = state.status;

  for (const call of toolCalls) {
    const targetTool = toolsByNameMap[call.name];
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

    // Determine Step Name & Log Event Type
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

    // Execute Tool Safely
    let toolResultString: string;
    try {
      toolResultString = await targetTool.invoke(call.args);
    } catch (err: any) {
      toolResultString = JSON.stringify({ success: false, error: err.message || 'Tool execution error' });
    }

    // Parse Tool Result for State Synchronization
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
    } catch (e) {
      // Ignore JSON parse errors for raw strings
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

/**
 * Conditional Router Edge
 */
function shouldContinue(state: RefundAgentState): string {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  if (lastMessage && lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return 'tools';
  }
  return END;
}

/**
 * Build & Compile LangGraph StateGraph
 */
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
