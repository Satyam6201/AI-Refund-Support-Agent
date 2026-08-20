import { NextRequest, NextResponse } from 'next/server';
import { runRefundAgentWorkflow } from '@/core/agent/runner';
import { z } from 'zod';

const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  customerId: z.string().optional(),
  orderId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ChatRequestSchema.parse(body);

    const result = await runRefundAgentWorkflow({
      userMessage: parsed.message,
      customerId: parsed.customerId,
      orderId: parsed.orderId,
    });

    return NextResponse.json({
      success: true,
      executionId: result.executionId,
      status: result.status,
      message: result.finalDecision,
      state: {
        customerId: result.state?.customerId,
        orderId: result.state?.orderId,
        policyResult: result.state?.policyResult,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An error occurred while processing the agent request.',
      },
      { status: 400 }
    );
  }
}
