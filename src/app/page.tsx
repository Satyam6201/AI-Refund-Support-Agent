import React from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { Bot, Database, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen pb-16">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8 animate-fade-in-up">
        <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-white/10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-3xl space-y-5 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-blue-200 text-xs font-bold tracking-wide shadow-sm hover:scale-105 transition-transform">
              <SparklesIcon className="w-4 h-4 text-blue-300 animate-pulse" /> Next.js App Router + LangGraph.js + Prisma ORM
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl leading-tight text-white drop-shadow-md">
              AI Customer Support <span className="gradient-text">Refund Agent</span>
            </h1>
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-medium max-w-2xl">
              Production-quality Next.js workspace powering a zero-trust AI refund agent. Features a 100% deterministic policy engine, Neon PostgreSQL database, LangGraph state machine, and real-time execution log audit traces.
            </p>

            <div className="pt-4 flex flex-wrap gap-3">
              <Link
                href="/chat"
                className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl hover:shadow-blue-500/25 transition-all hover:scale-105 flex items-center gap-2"
              >
                Open Customer Chat UI <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/admin"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-sm rounded-2xl border border-white/20 transition-all hover:scale-105 flex items-center gap-2"
              >
                Admin Dashboard & Live Logs
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Bot className="w-5 h-5 text-blue-600" /> Customer Chat Interface
              </h3>
              <Link href="/chat">
                <Badge variant="outline" className="hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 transition-colors cursor-pointer">
                  Launch Full Page →
                </Badge>
              </Link>
            </div>
            <ChatContainer />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Database className="w-5 h-5 text-indigo-600" /> Database & Test Scenarios
              </h3>
              <Link href="/admin">
                <Badge variant="outline" className="hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 transition-colors cursor-pointer">
                  View Real-Time Logs →
                </Badge>
              </Link>
            </div>
            <AdminDashboard />
          </div>
        </div>
      </main>
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}
