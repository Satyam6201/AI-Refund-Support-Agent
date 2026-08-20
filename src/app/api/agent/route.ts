import { NextRequest, NextResponse } from 'next/server';
import { runRefundAgentWorkflow } from '@/core/agent/runner';
import { z } from 'zod';

const AgentRequestSchema = z.object({
  message: z.string().min(1, 'Message query is required'),
  customerId: z.string().optional(),
  orderId: z.string().optional(),
  maxRetries: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AgentRequestSchema.parse(body);

    const result = await runRefundAgentWorkflow({
      userMessage: parsed.message,
      customerId: parsed.customerId,
      orderId: parsed.orderId,
      maxRetries: parsed.maxRetries,
    });

    return NextResponse.json(
      {
        success: true,
        executionId: result.executionId,
        status: result.status,
        finalDecision: result.finalDecision,
        state: {
          customerId: result.state?.customerId,
          orderId: result.state?.orderId,
          policyResult: result.state?.policyResult,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Agent Execution Error' },
      { status: 500 }
    );
  }
}
