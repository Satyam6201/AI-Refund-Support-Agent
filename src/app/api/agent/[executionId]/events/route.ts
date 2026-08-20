import { NextRequest, NextResponse } from 'next/server';
import { AgentLogService } from '@/services/agent-log.service';
import { z } from 'zod';
import { LogType } from '@prisma/client';

const EventSchema = z.object({
  step: z.string().min(1),
  type: z.enum(['TOOL_CALL', 'TOOL_RESULT', 'POLICY_CHECK', 'REASONING', 'SYSTEM', 'ERROR']),
  message: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ executionId: string }> }
) {
  try {
    const { executionId } = await params;
    const body = await req.json();
    const parsed = EventSchema.parse(body);

    const log = await AgentLogService.addLog({
      executionId,
      step: parsed.step,
      type: parsed.type as LogType,
      message: parsed.message,
      metadata: parsed.metadata,
    });

    return NextResponse.json({ success: true, log }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record event log' },
      { status: 400 }
    );
  }
}
