import { NextRequest } from 'next/server';
import { AgentLogService } from '@/services/agent-log.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Push initial metrics & execution snapshot
      try {
        const metrics = await AgentLogService.getMetrics();
        const executions = await AgentLogService.getAllExecutions(20);
        sendEvent({ type: 'INIT', metrics, executions });
      } catch (err: any) {
        sendEvent({ type: 'ERROR', error: err.message });
      }

      // Heartbeat interval to maintain active SSE connection
      const interval = setInterval(async () => {
        try {
          const metrics = await AgentLogService.getMetrics();
          const executions = await AgentLogService.getAllExecutions(20);
          sendEvent({ type: 'UPDATE', metrics, executions });
        } catch (e) {
          // Ignore transient polling stream errors
        }
      }, 3000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
