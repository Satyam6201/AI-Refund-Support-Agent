import { NextRequest, NextResponse } from 'next/server';
import { AgentLogService } from '@/services/agent-log.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const execution = await AgentLogService.getExecutionById(id);

    if (!execution) {
      return NextResponse.json(
        { success: false, error: `Execution '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, execution });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch execution detail' },
      { status: 500 }
    );
  }
}
