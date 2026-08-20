'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, MessageSquare, LayoutDashboard, Home, Menu, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Customer Chat', href: '/chat', icon: MessageSquare },
    { label: 'Admin Dashboard', href: '/admin', icon: LayoutDashboard },
  ];

  return (
    <nav className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 animate-pulse-glow">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                AI Refund Support Agent
              </span>
              <span className="block text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                LangGraph.js & Prisma Workspace
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-1 bg-slate-100/60 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
            {navItems.map((item) => {
              const isActive = mounted && pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-blue-600 dark:bg-slate-900 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700 scale-105'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform ${isActive ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <Badge variant="success" className="px-3.5 py-1 flex items-center gap-2 font-semibold text-[11px] shadow-sm hover:scale-105 transition-transform">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Active
            </Badge>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white dark:bg-slate-900 px-4 pt-3 pb-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const isActive = mounted && pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t flex items-center justify-between px-2">
            <span className="text-xs text-slate-500 font-medium">Database Status:</span>
            <Badge variant="success" className="px-2.5 py-0.5 text-xs">
              Neon PostgreSQL Connected
            </Badge>
          </div>
        </div>
      )}
    </nav>
  );
}
