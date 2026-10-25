import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  VolumeX,
  CheckCircle,
  AlertOctagon,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { CPR_GUIDE_STEPS } from '../../data/cprData';
import { CprStep } from '../../types/health';

interface CprGuideViewerProps {
  onOpenTrainer: () => void;
  onTriggerSos: () => void;
}

export const CprGuideViewer: React.FC<CprGuideViewerProps> = ({
  onOpenTrainer,
  onTriggerSos,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeStepId, setActiveStepId] = useState<string>(CPR_GUIDE_STEPS[0].id);
  const [isNarrating, setIsNarrating] = useState<boolean>(false);
  const [masteredSteps, setMasteredSteps] = useState<Record<string, boolean>>({});

  const filteredSteps = CPR_GUIDE_STEPS.filter((step) => {
    const matchesCategory =
      selectedCategory === 'all' || step.category === selectedCategory;
    const matchesSearch =
      step.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      step.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      step.criticalRule.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeStep =
    CPR_GUIDE_STEPS.find((s) => s.id === activeStepId) || CPR_GUIDE_STEPS[0];

  const toggleNarrate = (step: CprStep) => {
    if (!('speechSynthesis' in window)) return;
    if (isNarrating) {
      window.speechSynthesis.cancel();
      setIsNarrating(false);
      return;
    }

    const narrationText = `${step.title}. ${step.subtitle}. Critical rule: ${step.criticalRule}. ${step.description}. Instructions: ${step.bullets.join('. ')}`;
    const utter = new SpeechSynthesisUtterance(narrationText);
    utter.rate = 0.95;
    utter.onend = () => setIsNarrating(false);
    utter.onerror = () => setIsNarrating(false);

    setIsNarrating(true);
    window.speechSynthesis.speak(utter);
  };

  const toggleMastered = (id: string) => {
    setMasteredSteps((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const categories = [
    { id: 'all', label: 'All Steps' },
    { id: 'assessment', label: 'DRS Assessment' },
    { id: 'compressions', label: 'Chest Compressions' },
    { id: 'breaths', label: 'Rescue Breaths' },
    { id: 'aed', label: 'Defibrillator (AED)' },
    { id: 'recovery', label: 'Recovery Position' },
    { id: 'choking', label: 'Choking / Heimlich' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Interactive Visual First Aid Guides</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Step-by-Step CPR & Emergency Procedures
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
            Detailed clinical protocols compliant with AHA & ERC resuscitation guidelines, complete with visual anatomical guidance and audio narration.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenTrainer}
            className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Launch Metronome Coach →
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Filter Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search procedures or signs..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Main Two-Column Guide Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Step Index List */}
        <div className="lg:col-span-5 space-y-2.5">
          {filteredSteps.map((step) => {
            const isActive = step.id === activeStep.id;
            const isDone = !!masteredSteps[step.id];

            return (
              <div
                key={step.id}
                onClick={() => {
                  if (isNarrating) {
                    window.speechSynthesis.cancel();
                    setIsNarrating(false);
                  }
                  setActiveStepId(step.id);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-rose-50/70 border-rose-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMastered(step.id);
                    }}
                    className={`mt-0.5 p-1 rounded-full transition-colors cursor-pointer ${
                      isDone ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-500'
                    }`}
                    title={isDone ? 'Mark unreviewed' : 'Mark reviewed'}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <div>
                    <h3 className={`text-sm font-bold ${isActive ? 'text-rose-950' : 'text-slate-900'}`}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{step.subtitle}</p>
                  </div>
                </div>

                <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? 'text-rose-600' : 'text-slate-400'}`} />
              </div>
            );
          })}
        </div>

        {/* Right Column: Detailed Active Step Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                Action Protocol
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                {activeStep.title}
              </h2>
              <p className="text-sm font-medium text-slate-600 mt-1">
                {activeStep.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleNarrate(activeStep)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isNarrating
                    ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isNarrating ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isNarrating ? 'Stop Voice' : 'Audio Narration'}</span>
              </button>
            </div>
          </div>

          {/* Critical Rule Callout Box */}
          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
                Critical Lifesaving Rule
              </span>
              <p className="text-xs font-semibold text-rose-800 mt-0.5">
                {activeStep.criticalRule}
              </p>
            </div>
          </div>

          {/* High-Fidelity Anatomical or Device Image (if present) */}
          {activeStep.imageSrc && (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 relative">
              <img
                src={activeStep.imageSrc}
                alt={activeStep.title}
                referrerPolicy="no-referrer"
                className="w-full h-64 sm:h-72 object-cover"
              />
              {activeStep.calloutText && (
                <div className="p-3 bg-slate-900/90 text-white text-xs border-t border-slate-800">
                  <span className="font-semibold text-rose-400">Pro-Tip: </span>
                  {activeStep.calloutText}
                </div>
              )}
            </div>
          )}

          {/* Description & Concrete Bullet Actions */}
          <div className="space-y-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              {activeStep.description}
            </p>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Action Checklist
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {activeStep.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <button
              onClick={() => toggleMastered(activeStep.id)}
              className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{masteredSteps[activeStep.id] ? 'Reviewed & Mastered ✓' : 'Mark as Reviewed'}</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onOpenTrainer}
                className="text-slate-700 hover:text-slate-900 font-medium cursor-pointer"
              >
                Practice Cadence →
              </button>
              <button
                onClick={onTriggerSos}
                className="text-rose-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Emergency SOS</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
