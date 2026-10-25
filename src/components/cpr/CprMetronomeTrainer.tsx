import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Heart,
  Volume2,
  VolumeX,
  Play,
  Square,
  RotateCcw,
  Activity,
  Award,
  Music,
  User,
  Baby,
  Smile,
  ShieldAlert,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { CprRecipientType, CprPracticeSession } from '../../types/health';
import { soundService } from '../../utils/audioMetronome';
import { saveCprSession, getStoredCprHistory } from '../../utils/storage';
import { CPR_IMAGES } from '../../data/cprData';

interface CprMetronomeTrainerProps {
  onTriggerSos: () => void;
  onOpenStepGuide: () => void;
}

export const CprMetronomeTrainer: React.FC<CprMetronomeTrainerProps> = ({
  onTriggerSos,
  onOpenStepGuide,
}) => {
  // Metronome & Audio State
  const [targetBpm, setTargetBpm] = useState<number>(110);
  const [isPlayingMetronome, setIsPlayingMetronome] = useState<boolean>(false);
  const [recipient, setRecipient] = useState<CprRecipientType>('adult');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [voiceCuesEnabled, setVoiceCuesEnabled] = useState<boolean>(true);
  const [metronomeBeatCount, setMetronomeBeatCount] = useState<number>(0);

  // Interactive User Compression Training
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [userCompressionsCount, setUserCompressionsCount] = useState<number>(0);
  const [currentCycle, setCurrentCycle] = useState<number>(1);
  const [isBreathingPhase, setIsBreathingPhase] = useState<boolean>(false);
  const [breathingCountdown, setBreathingCountdown] = useState<number>(4);
  const [lastTapTime, setLastTapTime] = useState<number | null>(null);
  const [userBpm, setUserBpm] = useState<number | null>(null);
  const [recentIntervals, setRecentIntervals] = useState<number[]>([]);
  const [accurateCount, setAccurateCount] = useState<number>(0);
  const [practiceStartTime, setPracticeStartTime] = useState<number | null>(null);
  const [practiceSeconds, setPracticeSeconds] = useState<number>(0);
  const [lastFeedback, setLastFeedback] = useState<'perfect' | 'slow' | 'fast' | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState<CprPracticeSession | null>(null);
  const [savedSuccessNotice, setSavedSuccessNotice] = useState<boolean>(false);

  // Practice history
  const [history, setHistory] = useState<CprPracticeSession[]>(getStoredCprHistory());

  // Ref for speech synthesis
  const speakCue = (text: string) => {
    if (!voiceCuesEnabled || !('speechSynthesis' in window)) return;
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.1;
      utter.volume = 0.8;
      window.speechSynthesis.speak(utter);
    } catch {
      // ignore
    }
  };

  // Timer for practice duration
  useEffect(() => {
    let interval: number | null = null;
    if (isPracticing) {
      interval = window.setInterval(() => {
        setPracticeSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPracticing]);

  // Breathing phase countdown
  useEffect(() => {
    let timer: number | null = null;
    if (isBreathingPhase) {
      timer = window.setInterval(() => {
        setBreathingCountdown((prev) => {
          if (prev <= 1) {
            setIsBreathingPhase(false);
            speakCue('Resume compressions');
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isBreathingPhase]);

  // Handle metronome start/stop
  const toggleMetronome = () => {
    if (isPlayingMetronome) {
      soundService.stopMetronome();
      setIsPlayingMetronome(false);
      setMetronomeBeatCount(0);
    } else {
      setIsPlayingMetronome(true);
      soundService.startMetronome(targetBpm, (count) => {
        setMetronomeBeatCount(count);
      });
    }
  };

  // Update metronome if BPM changes while playing
  useEffect(() => {
    if (isPlayingMetronome) {
      soundService.startMetronome(targetBpm, (count) => {
        setMetronomeBeatCount(count);
      });
    }
    return () => {
      soundService.stopMetronome();
    };
  }, [targetBpm, isPlayingMetronome]);

  // User Tap / Compression Handler
  const handleUserCompression = useCallback(() => {
    if (isBreathingPhase) return;

    const now = performance.now();

    // Start practice automatically if not active
    if (!isPracticing) {
      setIsPracticing(true);
      setPracticeStartTime(Date.now());
      setPracticeSeconds(0);
      setUserCompressionsCount(1);
      setAccurateCount(0);
      setRecentIntervals([]);
      setLastTapTime(now);
      setSessionCompleted(null);
      if (soundEnabled) soundService.playClick(true);
      return;
    }

    if (soundEnabled) soundService.playClick(userCompressionsCount % 30 === 0);

    const nextCount = userCompressionsCount + 1;
    setUserCompressionsCount(nextCount);

    if (lastTapTime) {
      const delta = now - lastTapTime;
      // Filter out double clicks < 150ms
      if (delta > 150 && delta < 2000) {
        const calculatedBpm = Math.round(60000 / delta);
        setUserBpm(calculatedBpm);

        const updated = [...recentIntervals, calculatedBpm].slice(-8);
        setRecentIntervals(updated);

        if (calculatedBpm >= 100 && calculatedBpm <= 120) {
          setAccurateCount((prev) => prev + 1);
          setLastFeedback('perfect');
        } else if (calculatedBpm < 100) {
          setLastFeedback('slow');
        } else {
          setLastFeedback('fast');
        }
      }
    }
    setLastTapTime(now);

    // Check 30:2 cycle for non-hands-only
    if (recipient !== 'hands_only' && nextCount % 30 === 0) {
      setIsBreathingPhase(true);
      setBreathingCountdown(4);
      setCurrentCycle((prev) => prev + 1);
      speakCue('30 reached. Give 2 rescue breaths.');
    } else if (recipient === 'hands_only' && nextCount % 100 === 0) {
      speakCue(`${nextCount} compressions completed. Check victim or rotate rescuer.`);
    }
  }, [
    isBreathingPhase,
    isPracticing,
    soundEnabled,
    userCompressionsCount,
    lastTapTime,
    recentIntervals,
    recipient,
  ]);

  // Keyboard shortcut: Spacebar for compressions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleUserCompression();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUserCompression]);

  // Finish practice session
  const finishPractice = () => {
    if (!isPracticing) return;
    setIsPracticing(false);
    setIsBreathingPhase(false);

    const accuracy = userCompressionsCount > 0 ? Math.round((accurateCount / userCompressionsCount) * 100) : 0;
    const avgBpm = recentIntervals.length > 0
      ? Math.round(recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length)
      : targetBpm;

    const session: CprPracticeSession = {
      id: `cpr-${Date.now()}`,
      timestamp: Date.now(),
      recipientType: recipient,
      durationSeconds: Math.max(practiceSeconds, 1),
      totalCompressions: userCompressionsCount,
      averageBpm: avgBpm,
      targetAccuracyPercent: accuracy,
      completedCycles: recipient === 'hands_only' ? Math.floor(userCompressionsCount / 30) : currentCycle,
    };

    saveCprSession(session);
    setSessionCompleted(session);
    setHistory(getStoredCprHistory());
    setSavedSuccessNotice(true);
    setTimeout(() => setSavedSuccessNotice(false), 3000);
  };

  const resetPractice = () => {
    setIsPracticing(false);
    setIsBreathingPhase(false);
    setUserCompressionsCount(0);
    setCurrentCycle(1);
    setLastTapTime(null);
    setUserBpm(null);
    setRecentIntervals([]);
    setAccurateCount(0);
    setPracticeSeconds(0);
    setLastFeedback(null);
    setSessionCompleted(null);
  };

  // Recipient details
  const recipientSpecs = {
    adult: {
      depth: '5 – 6 cm (2 – 2.4 in)',
      handTechnique: 'Two hands interlocked, heel on center sternum',
      ratio: '30 Compressions : 2 Breaths',
      target: '100 – 120 BPM',
      icon: <User className="w-4 h-4" />,
    },
    child: {
      depth: '5 cm (2 in)',
      handTechnique: 'One or two hands on lower half of sternum',
      ratio: '30 Compressions : 2 Breaths',
      target: '100 – 120 BPM',
      icon: <Smile className="w-4 h-4" />,
    },
    infant: {
      depth: '4 cm (1.5 in)',
      handTechnique: 'Two fingers (or two thumbs encircling chest)',
      ratio: '30 Compressions : 2 Breaths',
      target: '100 – 120 BPM',
      icon: <Baby className="w-4 h-4" />,
    },
    hands_only: {
      depth: '5 – 6 cm (2 – 2.4 in)',
      handTechnique: 'Two hands interlocked, lock elbows straight',
      ratio: 'Continuous (No Breaths)',
      target: '100 – 120 BPM',
      icon: <Activity className="w-4 h-4" />,
    },
  };

  const currentSpec = recipientSpecs[recipient];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Top Hero Card with Clinical Context */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="p-6 sm:p-8 lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">
                <Heart className="w-4 h-4 fill-rose-600 text-rose-600" />
                <span>Life Support Guidance · AHA & ERC Standard</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Interactive CPR Metronome & Rhythm Coach
              </h1>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                Sudden cardiac arrest survival doubles or triples with immediate bystander CPR. Train your muscle memory to maintain the life-saving rate of <strong>100 to 120 beats per minute</strong>.
              </p>
            </div>

            {/* Recipient Mode Tabs */}
            <div className="pt-6">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Select CPR Recipient Mode
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-slate-100 rounded-xl">
                {(['adult', 'child', 'infant', 'hands_only'] as CprRecipientType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setRecipient(type);
                      resetPractice();
                    }}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      recipient === type
                        ? 'bg-white text-slate-900 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {recipientSpecs[type].icon}
                    <span className="capitalize">{type.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>

              {/* Recipient Clinical Rules Kicker */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <span>Depth: <strong className="text-slate-900">{currentSpec.depth}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Ratio: <strong className="text-slate-900">{currentSpec.ratio}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Technique: <strong className="text-slate-900">{currentSpec.handTechnique}</strong></span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 relative min-h-[220px] flex items-center justify-center overflow-hidden">
            <img
              src={CPR_IMAGES.compressionHands}
              alt="Proper CPR Hand Placement"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-transparent" />
            <div className="relative z-10 p-6 text-center text-white">
              <span className="text-xs uppercase tracking-widest text-rose-400 font-bold block mb-1">
                Hand Position & Stance
              </span>
              <p className="text-sm font-medium text-slate-200 max-w-xs mx-auto">
                Heel of hand on center breastbone. Interlock fingers, lock elbows straight, push using your torso weight.
              </p>
              <button
                onClick={onOpenStepGuide}
                className="mt-3 px-3 py-1.5 text-xs bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-colors cursor-pointer"
              >
                View Full Step-by-Step Guide →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Metronome & Practice Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Real-time Audio Metronome Controller */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Audio Metronome Guide</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVoiceCuesEnabled(!voiceCuesEnabled)}
                  className={`px-2 py-1 text-xs rounded border transition-colors cursor-pointer ${
                    voiceCuesEnabled
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                  title="Voice count announcements"
                >
                  Voice Cues: {voiceCuesEnabled ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
                  title="Mute click audio"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Visual Pulsing Heart Element */}
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-100 relative">
              <div
                className={`relative flex items-center justify-center w-32 h-32 rounded-full transition-transform ${
                  isPlayingMetronome ? 'animate-cpr-beat' : ''
                }`}
                style={{
                  animationDuration: `${(60 / targetBpm).toFixed(3)}s`,
                }}
              >
                <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping opacity-30" />
                <div className="w-24 h-24 rounded-full bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-600/30">
                  <Heart className="w-12 h-12 text-white fill-white" />
                </div>
              </div>

              <div className="mt-4 text-center">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {targetBpm}
                </span>
                <span className="text-xs text-slate-500 font-medium ml-1">BPM</span>
                <p className="text-xs text-rose-600 font-semibold mt-0.5">
                  Standard Lifesaving Rhythm
                </p>
              </div>
            </div>

            {/* Rhythm Songs Matchers */}
            <div className="mt-5 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" />
                Rhythm Match Songs
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <button
                  onClick={() => setTargetBpm(104)}
                  className={`p-2 rounded-xl text-xs border transition-colors cursor-pointer ${
                    targetBpm === 104
                      ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold leading-tight">Stayin' Alive</p>
                  <p className="text-[10px] text-slate-500">104 BPM</p>
                </button>
                <button
                  onClick={() => setTargetBpm(110)}
                  className={`p-2 rounded-xl text-xs border transition-colors cursor-pointer ${
                    targetBpm === 110
                      ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold leading-tight">AHA Preset</p>
                  <p className="text-[10px] text-slate-500">110 BPM</p>
                </button>
                <button
                  onClick={() => setTargetBpm(115)}
                  className={`p-2 rounded-xl text-xs border transition-colors cursor-pointer ${
                    targetBpm === 115
                      ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold leading-tight">Baby Shark</p>
                  <p className="text-[10px] text-slate-500">115 BPM</p>
                </button>
              </div>
            </div>

            {/* Slider to adjust target BPM */}
            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>100 BPM</span>
                <span className="font-bold text-slate-900">{targetBpm} BPM</span>
                <span>120 BPM</span>
              </div>
              <input
                type="range"
                min="100"
                max="120"
                step="2"
                value={targetBpm}
                onChange={(e) => setTargetBpm(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={toggleMetronome}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md ${
              isPlayingMetronome
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/20'
            }`}
          >
            {isPlayingMetronome ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                <span>Stop Metronome Clicks</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Start Audio Metronome</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Interactive Tactile Compression Pad & Practice Coach */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Live Compression Trainer</h2>
                <p className="text-xs text-slate-500">
                  Tap the sensor pad or press <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded text-[10px] font-mono">Spacebar</kbd> in rhythm
                </p>
              </div>

              {isPracticing && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={finishPractice}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                  >
                    Finish Session
                  </button>
                  <button
                    onClick={resetPractice}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg border border-slate-200 cursor-pointer"
                    title="Reset practice"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Live Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Compressions
                </span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {userCompressionsCount}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {recipient === 'hands_only' ? 'Continuous' : `Cycle ${currentCycle} (${userCompressionsCount % 30}/30)`}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Your Cadence
                </span>
                <span className={`text-2xl font-extrabold font-mono tabular-nums ${
                  userBpm && userBpm >= 100 && userBpm <= 120
                    ? 'text-emerald-600'
                    : userBpm
                    ? 'text-amber-600'
                    : 'text-slate-400'
                }`}>
                  {userBpm || '--'}
                </span>
                <span className="text-[10px] text-slate-500 block">Target: 100-120 BPM</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Accuracy
                </span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {userCompressionsCount > 0 ? Math.round((accurateCount / userCompressionsCount) * 100) : 0}%
                </span>
                <span className="text-[10px] text-slate-500 block">In target rate window</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Elapsed Time
                </span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {Math.floor(practiceSeconds / 60)}:{(practiceSeconds % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] text-slate-500 block">Rotate at 2:00</span>
              </div>
            </div>

            {/* Breathing Phase Alert Overlay */}
            {isBreathingPhase && (
              <div className="p-6 mb-4 bg-sky-50 border-2 border-sky-400 rounded-2xl text-center animate-pulse">
                <span className="text-xs font-bold uppercase tracking-widest text-sky-700">
                  30 Compressions Completed
                </span>
                <h3 className="text-2xl font-black text-sky-950 mt-1">
                  Deliver 2 Rescue Breaths Now!
                </h3>
                <p className="text-xs text-sky-800 mt-1 max-w-sm mx-auto">
                  Tilt head, lift chin, pinch nose. Blow gently until chest visibly rises (1 sec each).
                </p>
                <div className="mt-3 text-3xl font-extrabold text-sky-600 font-mono tabular-nums">
                  Resuming in {breathingCountdown}s
                </div>
              </div>
            )}

            {/* Large Interactive Compression Sensor Pad */}
            {!isBreathingPhase && (
              <button
                type="button"
                onClick={handleUserCompression}
                className={`w-full py-12 px-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 select-none active:scale-95 cursor-pointer shadow-lg ${
                  lastFeedback === 'perfect'
                    ? 'bg-emerald-50 border-emerald-400 shadow-emerald-500/10'
                    : lastFeedback === 'slow'
                    ? 'bg-amber-50 border-amber-400 shadow-amber-500/10'
                    : lastFeedback === 'fast'
                    ? 'bg-rose-50 border-rose-400 shadow-rose-500/10'
                    : 'bg-slate-50 border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="w-20 h-20 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-800">
                  <Activity className="w-10 h-10 text-rose-600 animate-pulse" />
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-bold text-slate-900">
                    {isPracticing ? 'TAP HERE TO COMPRESS' : 'PRESS TO START CPR PRACTICE'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Push down {currentSpec.depth} · Allow full recoil between pushes
                  </p>
                </div>

                {/* Instant Feedback Badge */}
                {lastFeedback && (
                  <div className="mt-1">
                    {lastFeedback === 'perfect' && (
                      <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full">
                        PERFECT CADENCE ({userBpm} BPM)
                      </span>
                    )}
                    {lastFeedback === 'slow' && (
                      <span className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-full">
                        TOO SLOW ({userBpm} BPM) — SPEED UP!
                      </span>
                    )}
                    {lastFeedback === 'fast' && (
                      <span className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-full">
                        TOO FAST ({userBpm} BPM) — SLOW DOWN SLIGHTLY
                      </span>
                    )}
                  </div>
                )}
              </button>
            )}
          </div>

          {/* Session Complete Card */}
          {sessionCompleted && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-sm font-bold text-emerald-950">
                    Session Logged & Completed!
                  </h4>
                </div>
                <span className="text-xs font-semibold text-emerald-800">
                  Score: {sessionCompleted.targetAccuracyPercent}% Accuracy
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-1">
                Completed {sessionCompleted.totalCompressions} compressions across {sessionCompleted.completedCycles} cycles with an average rate of {sessionCompleted.averageBpm} BPM.
              </p>
            </div>
          )}

          {/* Action Trigger in Emergency */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-slate-100">
            <span className="text-slate-500">
              Practicing for real emergencies? Real bystander CPR saves over 100,000 lives annually.
            </span>
            <button
              onClick={onTriggerSos}
              className="text-rose-600 font-bold hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Real Emergency? Open SOS</span>
            </button>
          </div>
        </div>
      </div>

      {/* CPR Practice History */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Your CPR Practice History</h3>
            <span className="text-xs text-slate-500">{history.length} logged sessions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 capitalize">
                    {item.recipientType.replace('_', ' ')} CPR
                  </span>
                  <span className="text-slate-500 font-mono text-[10px]">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Compressions: <strong className="text-slate-900">{item.totalCompressions}</strong></span>
                  <span>Avg: <strong className="text-slate-900">{item.averageBpm} BPM</strong></span>
                  <span>Accuracy: <strong className="text-emerald-600">{item.targetAccuracyPercent}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
