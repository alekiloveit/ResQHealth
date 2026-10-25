import React from 'react';
import { ShieldAlert, Phone, Mic } from 'lucide-react';
import { CustomSosNumber } from '../../types/health';

interface EmergencyFloatingBarProps {
  onTriggerSos: () => void;
  primarySosNumber: CustomSosNumber;
  isVoiceListening: boolean;
  onToggleVoice: () => void;
}

export const EmergencyFloatingBar: React.FC<EmergencyFloatingBarProps> = ({
  onTriggerSos,
  primarySosNumber,
  isVoiceListening,
  onToggleVoice,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-md border-t border-slate-200">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Voice Trigger Quick Switch */}
        <button
          onClick={onToggleVoice}
          className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border shrink-0 ${
            isVoiceListening
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
          title="Toggle voice command SOS trigger"
        >
          <Mic className={`w-3.5 h-3.5 ${isVoiceListening ? 'text-amber-600 animate-pulse' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">{isVoiceListening ? 'Voice SOS Active' : 'Voice Alert'}</span>
        </button>

        {/* Big Prominent SOS Trigger Button */}
        <button
          onClick={onTriggerSos}
          className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-xl font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
        >
          <ShieldAlert className="w-5 h-5 animate-pulse" />
          <span>Quick SOS Dispatch</span>
        </button>

        {/* 1-Tap Direct Call to Primary Emergency Number */}
        <a
          href={`tel:${primarySosNumber.number}`}
          className="px-3.5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          title={`Call ${primarySosNumber.label} (${primarySosNumber.number})`}
        >
          <Phone className="w-4 h-4 text-rose-400" />
          <span>{primarySosNumber.number}</span>
        </a>
      </div>
    </div>
  );
};
