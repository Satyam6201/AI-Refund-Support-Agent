import { prisma } from '@/lib/db';
import { AgentExecution, AgentLog } from '@/types/agent';
import { ExecutionStatus, LogType } from '@prisma/client';

export type EventLogType =
  | 'REQUEST_RECEIVED'
  | 'AGENT_STARTED'
  | 'CUSTOMER_LOOKUP'
  | 'ORDER_LOOKUP'
  | 'POLICY_CHECK'
  | 'POLICY_VIOLATION'
  | 'TOOL_CALL'
  | 'TOOL_SUCCESS'
  | 'TOOL_ERROR'
  | 'RETRY'
  | 'REFUND_PROCESSED'
  | 'REFUND_DENIED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'AGENT_COMPLETED'
  | 'AGENT_FAILED';

// In-memory fallback log store for development resilience
const MEMORY_EXECUTIONS: any[] = [];
const MEMORY_LOGS: any[] = [];

export class AgentLogService {
  static async createExecution(customerId: string | null, userMessage: string): Promise<AgentExecution> {
    const id = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newExec: AgentExecution = {
      id,
      customerId,
      userMessage,
      status: ExecutionStatus.IN_PROGRESS,
      finalDecision: null,
      startedAt: new Date(),
      completedAt: null,
    };

    try {
      return await prisma.agentExecution.create({
        data: {
          id,
          customerId,
          userMessage,
          status: ExecutionStatus.IN_PROGRESS,
        },
      });
    } catch (e) {
      console.warn('PostgreSQL offline, storing execution in memory.');
      MEMORY_EXECUTIONS.unshift(newExec);
      return newExec;
    }
  }

  static async addLog(params: {
    executionId: string;
    step: string;
    type: LogType;
    message: string;
    metadata?: Record<string, any>;
    event?: EventLogType;
  }): Promise<AgentLog> {
    const meta = {
      ...(params.metadata || {}),
      event: params.event || params.step.toUpperCase().replace(/\s+/g, '_'),
    };

    const newLog: AgentLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      executionId: params.executionId,
      step: params.step,
      type: params.type,
      message: params.message,
      metadata: meta,
      timestamp: new Date(),
    };

    try {
      const created = await prisma.agentLog.create({
        data: {
          executionId: params.executionId,
          step: params.step,
          type: params.type,
          message: params.message,
          metadata: meta,
        },
      });
      return created as unknown as AgentLog;
    } catch (e) {
      console.warn('PostgreSQL offline, storing log in memory.');
      MEMORY_LOGS.push(newLog);
      return newLog;
    }
  }

  static async updateExecutionStatus(
    executionId: string,
    status: ExecutionStatus,
    finalDecision?: string
  ): Promise<AgentExecution> {
    try {
      return await prisma.agentExecution.update({
        where: { id: executionId },
        data: {
          status,
          finalDecision,
          completedAt:
            status === ExecutionStatus.COMPLETED ||
            status === ExecutionStatus.FAILED ||
            status === ExecutionStatus.ESCALATED
              ? new Date()
              : null,
        },
      });
    } catch (e) {
      const exec = MEMORY_EXECUTIONS.find((m) => m.id === executionId);
      if (exec) {
        exec.status = status;
        exec.finalDecision = finalDecision || null;
        exec.completedAt = new Date();
      }
      return exec || {
        id: executionId,
        customerId: null,
        userMessage: '',
        status,
        finalDecision: finalDecision || null,
        startedAt: new Date(),
        completedAt: new Date(),
      };
    }
  }

  static async getExecutionById(executionId: string) {
    try {
      const dbExec = await prisma.agentExecution.findUnique({
        where: { id: executionId },
        include: {
          customer: true,
          logs: { orderBy: { timestamp: 'asc' } },
        },
      });
      if (dbExec) return dbExec;
    } catch (e) {}

    const mem = MEMORY_EXECUTIONS.find((m) => m.id === executionId);
    if (!mem) return null;
    return {
      ...mem,
      customer: { name: 'Aarav Sharma', email: 'aarav.sharma@example.com' },
      logs: MEMORY_LOGS.filter((l) => l.executionId === mem.id),
    };
  }

  static async getAllExecutions(limit = 50) {
    try {
      const dbExecs = await prisma.agentExecution.findMany({
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          customer: true,
          logs: { orderBy: { timestamp: 'asc' } },
        },
      });
      if (dbExecs.length > 0) return dbExecs;
    } catch (e) {
      console.warn('PostgreSQL offline, returning memory executions.');
    }

    return MEMORY_EXECUTIONS.map((e) => ({
      ...e,
      customer: { name: 'Aarav Sharma', email: 'aarav.sharma@example.com' },
      logs: MEMORY_LOGS.filter((l) => l.executionId === e.id),
    }));
  }

  static async getMetrics() {
    try {
      const totalExecutions = await prisma.agentExecution.count();
      const completedCount = await prisma.agentExecution.count({ where: { status: ExecutionStatus.COMPLETED } });
      const escalatedCount = await prisma.agentExecution.count({ where: { status: ExecutionStatus.ESCALATED } });
      const failedCount = await prisma.agentExecution.count({ where: { status: ExecutionStatus.FAILED } });

      const approvedRefunds = await prisma.refund.count({ where: { status: 'APPROVED' } });
      const pendingRefunds = await prisma.refund.count({ where: { status: 'PENDING' } });

      return {
        totalExecutions,
        completedCount,
        escalatedCount,
        failedCount,
        approvedRefunds,
        pendingRefunds,
      };
    } catch (e) {
      return {
        totalExecutions: MEMORY_EXECUTIONS.length,
        completedCount: MEMORY_EXECUTIONS.filter((m) => m.status === 'COMPLETED').length,
        escalatedCount: MEMORY_EXECUTIONS.filter((m) => m.status === 'ESCALATED').length,
        failedCount: MEMORY_EXECUTIONS.filter((m) => m.status === 'FAILED').length,
        approvedRefunds: 0,
        pendingRefunds: 0,
      };
    }
  }
}
