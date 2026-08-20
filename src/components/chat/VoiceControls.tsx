'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface VoiceControlsProps {
  onSpeechTranscribed: (text: string) => void;
  lastAgentMessage?: string;
  isProcessing: boolean;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: Array<Array<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function VoiceControls({ onSpeechTranscribed, lastAgentMessage, isProcessing }: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recogInstance = new SpeechRecognition();
      recogInstance.continuous = false;
      recogInstance.interimResults = false;
      recogInstance.lang = 'en-US';

      recogInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onSpeechTranscribed(transcript);
        }
        setIsListening(false);
      };

      recogInstance.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recogInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recogInstance);
    }
  }, [onSpeechTranscribed]);

  useEffect(() => {
    if (ttsEnabled && lastAgentMessage && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(lastAgentMessage);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [lastAgentMessage, ttsEnabled]);

  const toggleListening = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={toggleListening}
        disabled={isProcessing}
        title={isListening ? 'Listening... Click to stop' : 'Speak your request'}
        className={`p-2.5 rounded-xl transition-all border relative group ${
          isListening
            ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/30 scale-105'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
        }`}
      >
        {isListening && (
          <span className="absolute -inset-1 rounded-xl bg-rose-500/40 animate-ping pointer-events-none" />
        )}
        {isListening ? <MicOff className="h-4 w-4 relative z-10" /> : <Mic className="h-4 w-4 relative z-10" />}
      </button>

      <button
        type="button"
        onClick={() => setTtsEnabled(!ttsEnabled)}
        title={ttsEnabled ? 'Disable text-to-speech voice playback' : 'Enable text-to-speech voice playback'}
        className={`p-2 rounded-xl transition-all border ${
          ttsEnabled
            ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
            : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
        }`}
      >
        {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </button>
    </div>
  );
}
