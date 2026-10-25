/**
 * ResQHealth - Lifesaving CPR Interactive Coach & Emergency Health Tracker
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TopNav } from './components/TopNav';
import { CprMetronomeTrainer } from './components/cpr/CprMetronomeTrainer';
import { CprGuideViewer } from './components/cpr/CprGuideViewer';
import { CprQuiz } from './components/cpr/CprQuiz';
import { HealthTracker } from './components/health/HealthTracker';
import { EmergencyContactsManager } from './components/emergency/EmergencyContactsManager';
import { EmergencySosModal } from './components/emergency/EmergencySosModal';
import { EmergencyFloatingBar } from './components/emergency/EmergencyFloatingBar';
import { useVoiceTrigger } from './utils/useVoiceTrigger';
import {
  getStoredIceProfile,
  getStoredVitals,
  saveStoredIceProfile,
  saveStoredVitals,
} from './utils/storage';
import { IceProfile, VitalEntry } from './types/health';
import { ShieldAlert, Heart, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'cpr' | 'guides' | 'health' | 'contacts' | 'quiz'>('cpr');
  const [isSosOpen, setIsSosOpen] = useState<boolean>(false);
  const [sosTriggerMethod, setSosTriggerMethod] = useState<'manual_button' | 'voice_command' | 'cpr_emergency'>('manual_button');

  // Loaded profiles
  const [iceProfile, setIceProfile] = useState<IceProfile>(getStoredIceProfile());
  const [vitals, setVitals] = useState<VitalEntry[]>(getStoredVitals());

  // Voice SOS Trigger Hook
  const handleVoiceSosTrigger = useCallback((keyword: string) => {
    setSosTriggerMethod('voice_command');
    setIsSosOpen(true);
  }, []);

  const {
    isListening: isVoiceListening,
    isSupported: isVoiceSupported,
    lastTranscript,
    matchedKeyword,
    startListening,
    stopListening,
    triggerKeywords,
  } = useVoiceTrigger(handleVoiceSosTrigger);

  const toggleVoiceListening = () => {
    if (isVoiceListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const triggerSosManual = (method: 'manual_button' | 'cpr_emergency' = 'manual_button') => {
    setSosTriggerMethod(method);
    setIsSosOpen(true);
  };

  const primarySosNumber = iceProfile.sosNumbers.find((n) => n.isPrimary) || iceProfile.sosNumbers[0] || {
    id: 'def',
    label: 'Emergency',
    number: '911',
    isPrimary: true,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20">
      {/* Voice Recognition Active Notification Strip (when listening) */}
      {isVoiceListening && (
        <div className="bg-amber-500 text-amber-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
            <span>
              Voice SOS is listening... Say "HELP", "EMERGENCY", or "CALL 911" to trigger alert.
            </span>
            {lastTranscript && (
              <span className="text-amber-900 font-mono text-[11px] truncate max-w-xs">
                (Heard: "{lastTranscript}")
              </span>
            )}
          </div>
        </div>
      )}

      {/* Top Bar Contract Compliant Navigation */}
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSos={() => triggerSosManual('manual_button')}
        isVoiceListening={isVoiceListening}
        onToggleVoice={toggleVoiceListening}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'cpr' && (
          <CprMetronomeTrainer
            onTriggerSos={() => triggerSosManual('cpr_emergency')}
            onOpenStepGuide={() => setActiveTab('guides')}
          />
        )}

        {activeTab === 'guides' && (
          <CprGuideViewer
            onOpenTrainer={() => setActiveTab('cpr')}
            onTriggerSos={() => triggerSosManual('manual_button')}
          />
        )}

        {activeTab === 'health' && (
          <HealthTracker
            vitals={vitals}
            onUpdateVitals={setVitals}
            iceProfile={iceProfile}
            onUpdateProfile={setIceProfile}
            onTriggerSos={() => triggerSosManual('manual_button')}
            onOpenTrainer={() => setActiveTab('cpr')}
            onOpenQuiz={() => setActiveTab('quiz')}
          />
        )}

        {activeTab === 'contacts' && (
          <EmergencyContactsManager
            iceProfile={iceProfile}
            onUpdateProfile={setIceProfile}
            onTriggerSos={() => triggerSosManual('manual_button')}
            isVoiceListening={isVoiceListening}
            onToggleVoice={toggleVoiceListening}
            voiceKeywords={triggerKeywords}
          />
        )}

        {activeTab === 'quiz' && (
          <CprQuiz onOpenTrainer={() => setActiveTab('cpr')} />
        )}
      </main>

      {/* Bottom Floating Ergonomic SOS Trigger Bar */}
      <EmergencyFloatingBar
        onTriggerSos={() => triggerSosManual('manual_button')}
        primarySosNumber={primarySosNumber}
        isVoiceListening={isVoiceListening}
        onToggleVoice={toggleVoiceListening}
      />

      {/* Emergency SOS Modal with GPS, Multi-Contact dispatch & siren */}
      <EmergencySosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        iceProfile={iceProfile}
        initialTriggerMethod={sosTriggerMethod}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">ResQHealth</span>
            <span aria-hidden="true">·</span>
            <span>AHA & ERC CPR Guideline Compliant</span>
            <span aria-hidden="true">·</span>
            <span>Local Offline-Ready Storage</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <span>In an imminent life-threatening emergency, always dial your local emergency services ({primarySosNumber.number}) first.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
