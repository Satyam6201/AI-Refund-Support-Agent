'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, ShieldAlert, CheckCircle2, XCircle, Clock, Layers } from 'lucide-react';
import Link from 'next/link';

interface Log {
  id: string;
  step: string;
  type: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown> | null;
}

interface Execution {
  id: string;
  customerId?: string;
  customer?: { name: string; email: string };
  userMessage: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED' | 'FAILED';
  finalDecision?: string;
  startedAt: string;
  completedAt?: string;
  logs: Log[];
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState({
    totalExecutions: 0,
    completedCount: 0,
    escalatedCount: 0,
    failedCount: 0,
    approvedRefunds: 0,
    pendingRefunds: 0,
  });
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'ESCALATED' | 'FAILED'>('ALL');

  useEffect(() => {
    let eventSource: EventSource | null = null;

    async function fetchInitialData() {
      try {
        const res = await fetch('/api/admin/executions');
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (data.success) {
          setMetrics(data.metrics);
          setExecutions(data.executions);
          if (data.executions.length > 0) {
            setSelectedExecutionId((prev) => prev || data.executions[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      }
    }

    fetchInitialData();

    if (isLiveStreaming) {
      eventSource = new EventSource('/api/admin/logs/stream');
      eventSource.onmessage = (event) => {
        if (!event.data || typeof event.data !== 'string' || !event.data.trim()) return;
        try {
          const data = JSON.parse(event.data);
          if (data && (data.type === 'INIT' || data.type === 'UPDATE')) {
            if (data.metrics) setMetrics(data.metrics);
            if (data.executions) {
              setExecutions(data.executions);
              if (data.executions.length > 0) {
                setSelectedExecutionId((prev) => prev || data.executions[0].id);
              }
            }
          }
        } catch {
        }
      };
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [isLiveStreaming]);

  const filteredExecutions = executions.filter(
    (e) => statusFilter === 'ALL' || e.status === statusFilter
  );
  const selectedExecution = executions.find((e) => e.id === selectedExecutionId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      <div className="border-b bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-indigo-600 animate-pulse" />
            <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Real-Time Execution Logs & Analytics
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                isLiveStreaming
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              {isLiveStreaming ? 'SSE Live Stream Active' : 'Live Stream Paused'}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6 animate-fade-in-up">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl hover:scale-105 transition-transform cursor-pointer" onClick={() => setStatusFilter('ALL')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-xl">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Executions</p>
                <p className="text-2xl font-bold">{metrics.totalExecutions}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl hover:scale-105 transition-transform">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-xl">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Approved Refunds</p>
                <p className="text-2xl font-bold">{metrics.approvedRefunds}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl hover:scale-105 transition-transform cursor-pointer" onClick={() => setStatusFilter('ESCALATED')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-xl">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Human Approvals</p>
                <p className="text-2xl font-bold">{metrics.escalatedCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl hover:scale-105 transition-transform cursor-pointer" onClick={() => setStatusFilter('COMPLETED')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 rounded-xl">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Completed Runs</p>
                <p className="text-2xl font-bold">{metrics.completedCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl hover:scale-105 transition-transform cursor-pointer" onClick={() => setStatusFilter('FAILED')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-900/40 text-rose-600 rounded-xl">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Failed Runs</p>
                <p className="text-2xl font-bold">{metrics.failedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" /> Recent Runs ({filteredExecutions.length})
              </h2>

              <div className="flex gap-1 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-xl text-[10px] font-bold">
                {(['ALL', 'COMPLETED', 'ESCALATED', 'FAILED'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-2 py-0.5 rounded-lg transition-all ${
                      statusFilter === filter
                        ? 'bg-white text-blue-600 dark:bg-slate-900 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {filter === 'ALL' ? 'All' : filter.substring(0, 4)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredExecutions.map((exec) => {
                const isSelected = exec.id === selectedExecutionId;
                return (
                  <div
                    key={exec.id}
                    onClick={() => setSelectedExecutionId(exec.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 hover:scale-[1.01] ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 dark:bg-blue-950/40 dark:border-blue-700 shadow-md ring-1 ring-blue-400/50'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400">
                        {exec.id.substring(0, 16)}...
                      </span>
                      <Badge
                        variant={
                          exec.status === 'COMPLETED'
                            ? 'success'
                            : exec.status === 'ESCALATED'
                            ? 'warning'
                            : exec.status === 'FAILED'
                            ? 'danger'
                            : 'default'
                        }
                      >
                        {exec.status}
                      </Badge>
                    </div>

                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                      {`"${exec.userMessage}"`}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{exec.customer ? exec.customer.name : 'Guest User'}</span>
                      <span>{new Date(exec.startedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                );
              })}

              {executions.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 border rounded-xl bg-white dark:bg-slate-900">
                  No execution logs recorded yet. Visit the <Link href="/chat" className="text-blue-600 underline">Chat Page</Link> to run a request!
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" /> Step-by-Step Execution Audit Trace
            </h2>

            {selectedExecution ? (
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold">Execution ID: {selectedExecution.id}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Customer: {selectedExecution.customer ? `${selectedExecution.customer.name} (${selectedExecution.customer.email})` : 'Unidentified'}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        selectedExecution.status === 'COMPLETED'
                          ? 'success'
                          : selectedExecution.status === 'ESCALATED'
                          ? 'warning'
                          : selectedExecution.status === 'FAILED'
                          ? 'danger'
                          : 'default'
                      }
                      className="text-xs px-3 py-1"
                    >
                      {selectedExecution.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                    {selectedExecution.logs.map((log) => {
                      const isError = log.type === 'ERROR';
                      const isPolicy = log.type === 'POLICY_CHECK';
                      const isTool = log.type === 'TOOL_CALL' || log.type === 'TOOL_RESULT';

                      return (
                        <div key={log.id} className="relative flex items-start gap-3">
                          <div
                            className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-slate-950 ${
                              isError
                                ? 'border-rose-500 bg-rose-500'
                                : isPolicy
                                ? 'border-indigo-500 bg-indigo-500'
                                : isTool
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-emerald-500 bg-emerald-500'
                            }`}
                          />

                          <div className="w-full bg-slate-50 dark:bg-slate-900 border p-3 rounded-xl space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                {log.step}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300">{log.message}</p>

                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <details className="mt-1">
                                <summary className="cursor-pointer text-[11px] font-mono text-blue-600 dark:text-blue-400">
                                  View Event Payload Metadata
                                </summary>
                                <pre className="mt-1 p-2 bg-slate-900 text-slate-200 rounded text-[10px] overflow-x-auto font-mono">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedExecution.finalDecision && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1">
                      <h4 className="font-bold text-xs text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                        Final Agent Response Output
                      </h4>
                      <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                        {selectedExecution.finalDecision}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="p-12 text-center text-slate-400 text-xs rounded-2xl">
                Select an execution run from the left panel to inspect its live step-by-step trace.
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
