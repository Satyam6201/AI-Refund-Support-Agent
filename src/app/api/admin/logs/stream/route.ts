import { NextRequest } from 'next/server';
import { AgentLogService } from '@/services/agent-log.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const metrics = await AgentLogService.getMetrics();
        const executions = await AgentLogService.getAllExecutions(20);
        sendEvent({ type: 'INIT', metrics, executions });
      } catch (err: unknown) {
        const errorObj = err as Error;
        sendEvent({ type: 'ERROR', error: errorObj.message });
      }

      const interval = setInterval(async () => {
        try {
          const metrics = await AgentLogService.getMetrics();
          const executions = await AgentLogService.getAllExecutions(20);
          sendEvent({ type: 'UPDATE', metrics, executions });
        } catch {
        }
      }, 8000);

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
