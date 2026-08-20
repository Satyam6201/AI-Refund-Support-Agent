'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bot, Send } from 'lucide-react';

export function ChatContainer() {
  return (
    <Card className="h-[500px] flex flex-col justify-between border-slate-200 shadow-md">
      <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 rounded-lg">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Customer Support Assistant</CardTitle>
            <CardDescription>AI Agent powered by LangGraph.js & Prisma</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
            AI
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm text-slate-800 dark:text-slate-200">
            Hello! I am your AI Customer Support Agent. I can help process your return or refund requests according to our store policy. Please provide your order ID or account details!
          </div>
        </div>
      </CardContent>

      <div className="p-3 border-t bg-slate-50 dark:bg-slate-900 flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask a question or request a refund..."
          disabled
          className="flex-1 px-4 py-2 text-sm border rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-500 cursor-not-allowed"
        />
        <button
          disabled
          className="p-2 bg-blue-600 text-white rounded-lg opacity-50 cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
