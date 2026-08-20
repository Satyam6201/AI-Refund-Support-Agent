import { NextResponse } from 'next/server';
import { AgentLogService } from '@/services/agent-log.service';

export async function GET() {
  try {
    const metrics = await AgentLogService.getMetrics();
    const executions = await AgentLogService.getAllExecutions();

    return NextResponse.json({
      success: true,
      metrics,
      executions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch executions' },
      { status: 500 }
    );
  }
}
