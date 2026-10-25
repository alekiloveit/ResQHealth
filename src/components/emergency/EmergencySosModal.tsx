import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShieldAlert,
  MapPin,
  Phone,
  Volume2,
  VolumeX,
  Flashlight,
  Copy,
  Check,
  Send,
  MessageSquare,
  AlertTriangle,
  X,
  ExternalLink,
  Info,
} from 'lucide-react';
import { IceProfile, CustomSosNumber, EmergencyContact } from '../../types/health';
import { soundService } from '../../utils/audioMetronome';
import { logSosAlert } from '../../utils/storage';

interface EmergencySosModalProps {
  isOpen: boolean;
  onClose: () => void;
  iceProfile: IceProfile;
  initialTriggerMethod?: 'manual_button' | 'voice_command' | 'cpr_emergency';
}

export const EmergencySosModal: React.FC<EmergencySosModalProps> = ({
  isOpen,
  onClose,
  iceProfile,
  initialTriggerMethod = 'manual_button',
}) => {
  const [countdown, setCountdown] = useState<number | null>(3);
  const [isAlertActive, setIsAlertActive] = useState<boolean>(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isSirenOn, setIsSirenOn] = useState(false);
  const [isStrobeOn, setIsStrobeOn] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [speakingDispatch, setSpeakingDispatch] = useState(false);
  const loggedRef = useRef(false);

  // Fetch accurate location
  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: Math.round(pos.coords.accuracy),
        });
        setGeoError(null);
      },
      (err) => {
        setGeoError(err.message || 'Unable to retrieve precise location.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Countdown timer on open
  useEffect(() => {
    if (!isOpen) {
      setCountdown(null);
      setIsAlertActive(false);
      loggedRef.current = false;
      if (isSirenOn) {
        soundService.stopEmergencySiren();
        setIsSirenOn(false);
      }
      setIsStrobeOn(false);
      return;
    }

    refreshLocation();
    setCountdown(3);

    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          setIsAlertActive(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isOpen, refreshLocation]);

  // Log alert once active
  useEffect(() => {
    if (isAlertActive && !loggedRef.current) {
      loggedRef.current = true;
      const mapsUrl = coords
        ? `https://maps.google.com/?q=${coords.lat},${coords.lng}`
        : 'Location unavailable';

      const compiledMsg = iceProfile.customMessageTemplate
        .replace('{name}', iceProfile.fullName)
        .replace('{maps_link}', mapsUrl);

      const contactNames = iceProfile.contacts.map((c) => c.name);

      logSosAlert({
        id: `sos-${Date.now()}`,
        timestamp: Date.now(),
        triggerMethod: initialTriggerMethod,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        accuracy: coords?.acc ?? null,
        mapsUrl,
        messageText: compiledMsg,
        notifiedContactsCount: iceProfile.contacts.length,
        contactNames,
        sosNumberDialed: iceProfile.sosNumbers.find((n) => n.isPrimary)?.number,
      });
    }
  }, [isAlertActive, coords, iceProfile, initialTriggerMethod]);

  // Clean up sounds on unmount
  useEffect(() => {
    return () => {
      soundService.stopEmergencySiren();
    };
  }, []);

  if (!isOpen) return null;

  const mapsUrl = coords
    ? `https://maps.google.com/?q=${coords.lat},${coords.lng}`
    : 'https://maps.google.com';

  const defaultMsg = iceProfile.customMessageTemplate
    .replace('{name}', iceProfile.fullName || 'User')
    .replace('{maps_link}', mapsUrl);

  const toggleSiren = () => {
    if (isSirenOn) {
      soundService.stopEmergencySiren();
      setIsSirenOn(false);
    } else {
      soundService.startEmergencySiren();
      setIsSirenOn(true);
    }
  };

  const copyToClipboard = (text: string, type: 'link' | 'script') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  const speakDispatchScript = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingDispatch) {
      window.speechSynthesis.cancel();
      setSpeakingDispatch(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.onend = () => setSpeakingDispatch(false);
    utter.onerror = () => setSpeakingDispatch(false);
    setSpeakingDispatch(true);
    window.speechSynthesis.speak(utter);
  };

  const primarySosNumber = iceProfile.sosNumbers.find((n) => n.isPrimary) || iceProfile.sosNumbers[0] || {
    id: 'def',
    label: 'Emergency 911',
    number: '911',
    isPrimary: true,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      {/* Visual Strobe Overlay if active */}
      {isStrobeOn && (
        <div className="fixed inset-0 z-50 pointer-events-none animate-strobe opacity-60" />
      )}

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden my-6">
        {/* Top Emergency Status Bar */}
        <div className="bg-rose-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <div>
              <h2 className="text-lg font-bold tracking-tight">EMERGENCY SOS BEACON</h2>
              <p className="text-xs text-rose-100">
                Triggered via {initialTriggerMethod.replace('_', ' ')} · Help broadcast active
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isSirenOn) soundService.stopEmergencySiren();
              if (speakingDispatch) window.speechSynthesis.cancel();
              onClose();
            }}
            className="p-1 rounded-lg text-rose-100 hover:text-white hover:bg-rose-700/60 transition-colors cursor-pointer"
            title="Close Alert Beacon"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Countdown Phase */}
        {countdown !== null && (
          <div className="p-8 text-center bg-rose-50 border-b border-rose-100">
            <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">
              Safety Verification Buffer
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900 mb-2">
              Broadcasting Alert in {countdown}s
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-5">
              Press cancel if this was an accidental trigger. If not cancelled, emergency instructions and location will unlock.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setCountdown(null);
                  setIsAlertActive(true);
                }}
                className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                Send Instantly Now
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel Alert
              </button>
            </div>
          </div>
        )}

        {/* Active Emergency Controls Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Quick Call Emergency Dispatch Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Direct Emergency Dispatch Call
              </span>
              <span className="text-xs text-slate-500">Manual numbers configurable in contacts</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {iceProfile.sosNumbers.map((sos) => (
                <a
                  key={sos.id}
                  href={`tel:${sos.number}`}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    sos.isPrimary
                      ? 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700 shadow-md shadow-rose-600/20'
                      : 'bg-slate-50 text-slate-900 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${sos.isPrimary ? 'bg-rose-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold leading-tight">{sos.label}</p>
                      <p className={`text-base font-bold font-mono ${sos.isPrimary ? 'text-white' : 'text-slate-900'}`}>
                        {sos.number}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${sos.isPrimary ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    Tap to Call
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Current GPS Geolocation Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Current GPS Geolocation</h4>
                  {coords ? (
                    <p className="text-xs font-mono text-slate-600 mt-0.5">
                      {coords.lat.toFixed(5)}° N, {coords.lng.toFixed(5)}° W (±{coords.acc}m)
                    </p>
                  ) : geoError ? (
                    <p className="text-xs text-rose-600 mt-0.5">{geoError}</p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-0.5">Locating precise GPS satellites...</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={refreshLocation}
                  className="px-2.5 py-1 text-xs bg-white text-slate-700 border border-slate-200 rounded-md hover:bg-slate-100 cursor-pointer"
                >
                  Refresh
                </button>
                {coords && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-md hover:bg-rose-100 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Copy Coordinates Button */}
            {coords && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-600 font-mono truncate max-w-xs">{mapsUrl}</span>
                <button
                  onClick={() => copyToClipboard(mapsUrl, 'link')}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied Link' : 'Copy GPS Link'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Notify All Designated Contacts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Notify Designated Emergency Contacts ({iceProfile.contacts.length})
              </span>
              <button
                onClick={() => copyToClipboard(defaultMsg, 'script')}
                className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedScript ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedScript ? 'Message Copied' : 'Copy Alert Text'}</span>
              </button>
            </div>

            {iceProfile.contacts.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                No emergency contacts added yet. Add contacts in the Emergency Contacts tab.
              </div>
            ) : (
              <div className="space-y-2">
                {iceProfile.contacts.map((contact) => {
                  const smsHref = `sms:${contact.phone}?body=${encodeURIComponent(defaultMsg)}`;
                  const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
                  const waHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMsg)}`;

                  return (
                    <div
                      key={contact.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{contact.name}</span>
                          <span className="text-xs text-slate-500">({contact.relationship})</span>
                          {contact.isPrimary && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-slate-600">{contact.phone}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Direct SMS button */}
                        <a
                          href={smsHref}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>SMS Alert</span>
                        </a>

                        {/* WhatsApp button */}
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Call button */}
                        <a
                          href={`tel:${contact.phone}`}
                          className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer"
                          title={`Call ${contact.name}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dispatcher Voice & Reading Script */}
          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Dispatcher Speech Script (Read this to 911 / 112)
                </span>
                <p className="text-xs text-slate-700 mt-1 italic leading-relaxed">
                  "I am reporting a medical emergency. I am with an unresponsive person.
                  {coords ? ` My coordinates are latitude ${coords.lat.toFixed(4)}, longitude ${coords.lng.toFixed(4)}.` : ''}
                  CPR is in progress. Please send an ambulance with an AED."
                </p>
              </div>
              <button
                onClick={() =>
                  speakDispatchScript(
                    `I am reporting a medical emergency. I am with an unresponsive person. Location latitude ${
                      coords?.lat.toFixed(4) || 'unknown'
                    }, longitude ${coords?.lng.toFixed(4) || 'unknown'}. CPR in progress. Send an ambulance.`
                  )
                }
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{speakingDispatch ? 'Stop Voice' : 'Read Aloud'}</span>
              </button>
            </div>
          </div>

          {/* Audible Siren & Night Flash Strobe */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={toggleSiren}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                isSirenOn
                  ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isSirenOn ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSirenOn ? 'Stop Siren' : 'Audio Siren Beacon'}</span>
            </button>

            <button
              onClick={() => setIsStrobeOn(!isStrobeOn)}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                isStrobeOn
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Flashlight className="w-4 h-4" />
              <span>{isStrobeOn ? 'Stop Strobe' : 'Night Screen Strobe'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Medical Profile: {iceProfile.bloodType} · {iceProfile.allergies || 'No allergies recorded'}</span>
          <button
            onClick={() => {
              if (isSirenOn) soundService.stopEmergencySiren();
              if (speakingDispatch) window.speechSynthesis.cancel();
              onClose();
            }}
            className="text-slate-700 hover:text-slate-900 font-semibold cursor-pointer"
          >
            Dismiss SOS
          </button>
        </div>
      </div>
    </div>
  );
};
