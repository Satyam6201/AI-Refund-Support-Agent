'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Send, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VoiceControls } from '@/components/chat/VoiceControls';

interface Customer {
  id: string;
  name: string;
  email: string;
  tier: string;
}

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED' | 'FAILED';
  policyResult?: unknown;
}

export default function ChatPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_1',
      sender: 'agent',
      text: 'Hello! I am your AI Customer Support Refund Agent. Select your customer profile and ask any questions regarding returns or refunds. Voice input is also supported!',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastAgentText, setLastAgentText] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetch('/api/customers');
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (data.success && data.customers.length > 0) {
          setCustomers(data.customers);
          setSelectedCustomerId(data.customers[0].id);
        }
      } catch (err) {
        console.error('Failed to load customers:', err);
      }
    }
    loadCustomers();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          customerId: selectedCustomerId || undefined,
        }),
      });

      const responseText = await res.text();
      let data: { success?: boolean; error?: string; message?: string; status?: 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED' | 'FAILED'; state?: { policyResult?: unknown } } = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(res.ok ? 'Invalid response format from server' : `Server error (${res.status})`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to process request');
      }

      const agentMsg: Message = {
        id: `agt_${Date.now()}`,
        sender: 'agent',
        text: data.message || '',
        timestamp: new Date(),
        status: data.status,
        policyResult: data.state?.policyResult,
      };

      setMessages((prev) => [...prev, agentMsg]);
      setLastAgentText(data.message || '');
    } catch (err: unknown) {
      const errorObj = err as Error;
      setErrorMessage(errorObj.message || 'Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceTranscribed = (transcript: string) => {
    setInputText(transcript);
    handleSendMessage(transcript);
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans antialiased pb-12">
      <div className="max-w-6xl mx-auto w-full px-4 pt-6 flex-1 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card className="p-4 space-y-3 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" /> Active Customer Context
            </h2>

            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.tier})
                </option>
              ))}
            </select>

            {selectedCustomer && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs space-y-1.5 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800">
                <p className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedCustomer.email}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Account ID:</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{selectedCustomer.id}</span>
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-slate-500">Tier Status:</span>
                  <Badge variant={selectedCustomer.tier === 'VIP' ? 'success' : 'default'}>
                    {selectedCustomer.tier} Tier
                  </Badge>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-4 space-y-2 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
            <h3 className="font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Suggested Test Prompts
            </h3>
            <div className="space-y-2">
              {[
                'Can I get a refund for my latest order?',
                'I want to return my item.',
                'Why was my refund denied?',
              ].map((promptText, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(promptText)}
                  disabled={isLoading}
                  className="w-full text-left text-xs p-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-medium transition-all flex items-center justify-between group border border-blue-100 dark:border-blue-900/50"
                >
                  <span>{`"${promptText}"`}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card className="h-[620px] flex flex-col justify-between border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 animate-fade-in-up ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'agent' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-md">
                      AI
                    </div>
                  )}

                  <div className="space-y-1.5 max-w-[82%]">
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-md font-medium'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {msg.status && (
                      <div className="flex items-center gap-2 text-xs">
                        {msg.status === 'COMPLETED' && (
                          <Badge variant="success" className="flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> Policy Validated & Resolved
                          </Badge>
                        )}
                        {msg.status === 'ESCALATED' && (
                          <Badge variant="warning" className="flex items-center gap-1 font-semibold">
                            <ShieldAlert className="w-3 h-3" /> Escalated to Human Manager (&gt; ₹10,000)
                          </Badge>
                        )}
                        {msg.status === 'FAILED' && <Badge variant="danger">Execution Failure</Badge>}
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-md">
                      U
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 animate-pulse">
                    AI
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>LangGraph Agent executing policy checks & tool calls...</span>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <div className="p-3.5 border-t bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center gap-2">
              <VoiceControls
                onSpeechTranscribed={handleVoiceTranscribed}
                lastAgentMessage={lastAgentText}
                isProcessing={isLoading}
              />

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your refund inquiry or click the microphone to speak..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 text-sm border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder:text-slate-400"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputText.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
