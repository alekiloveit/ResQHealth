import React from 'react';
import { AlertCircle, Mic, ShieldAlert } from 'lucide-react';

interface TopNavProps {
  activeTab: 'cpr' | 'guides' | 'health' | 'contacts' | 'quiz';
  onSelectTab: (tab: 'cpr' | 'guides' | 'health' | 'contacts' | 'quiz') => void;
  onOpenSos: () => void;
  isVoiceListening: boolean;
  onToggleVoice: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenSos,
  isVoiceListening,
  onToggleVoice,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectTab('cpr')}
          className="text-left font-bold text-xl tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <span className="text-rose-600">ResQ</span>Health
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectTab('cpr')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 cursor-pointer ${
              activeTab === 'cpr' ? 'text-slate-900 font-semibold border-b-2 border-rose-600 pb-0.5' : ''
            }`}
          >
            CPR Trainer
          </button>
          <button
            onClick={() => onSelectTab('guides')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 cursor-pointer ${
              activeTab === 'guides' ? 'text-slate-900 font-semibold border-b-2 border-rose-600 pb-0.5' : ''
            }`}
          >
            Step Guides
          </button>
          <button
            onClick={() => onSelectTab('health')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 cursor-pointer ${
              activeTab === 'health' ? 'text-slate-900 font-semibold border-b-2 border-rose-600 pb-0.5' : ''
            }`}
          >
            Health Vitals
          </button>
          <button
            onClick={() => onSelectTab('contacts')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 cursor-pointer ${
              activeTab === 'contacts' ? 'text-slate-900 font-semibold border-b-2 border-rose-600 pb-0.5' : ''
            }`}
          >
            Emergency Contacts
          </button>
          <button
            onClick={() => onSelectTab('quiz')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 cursor-pointer ${
              activeTab === 'quiz' ? 'text-slate-900 font-semibold border-b-2 border-rose-600 pb-0.5' : ''
            }`}
          >
            Cert Quiz
          </button>
        </nav>

        {/* Zone 3: Primary Action & Voice Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleVoice}
            title={isVoiceListening ? 'Voice SOS Monitor is ACTIVE (listening for HELP/EMERGENCY)' : 'Enable Voice SOS Trigger'}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border ${
              isVoiceListening
                ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Mic className={`w-3.5 h-3.5 ${isVoiceListening ? 'text-amber-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">{isVoiceListening ? 'Voice Active' : 'Voice SOS'}</span>
          </button>

          <button
            onClick={onOpenSos}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-rose-600 rounded-lg hover:bg-rose-700 active:scale-95 transition-all shadow-md shadow-rose-600/20 whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>SOS Trigger</span>
          </button>
        </div>
      </div>
    </header>
  );
};
