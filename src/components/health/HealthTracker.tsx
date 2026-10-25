import React, { useState } from 'react';
import {
  Activity,
  Heart,
  Plus,
  TrendingUp,
  AlertTriangle,
  Download,
  Calendar,
  FileText,
  User,
  ShieldAlert,
  Check,
  Trash2,
} from 'lucide-react';
import { VitalEntry, IceProfile } from '../../types/health';
import {
  saveStoredVitals,
  saveStoredIceProfile,
  getStoredCprHistory,
  getStoredCprQuizScores,
} from '../../utils/storage';
import { CprD3TrendsVisualization } from './CprD3TrendsVisualization';

interface HealthTrackerProps {
  vitals: VitalEntry[];
  onUpdateVitals: (vitals: VitalEntry[]) => void;
  iceProfile: IceProfile;
  onUpdateProfile: (profile: IceProfile) => void;
  onTriggerSos: () => void;
  onOpenTrainer?: () => void;
  onOpenQuiz?: () => void;
}

export const HealthTracker: React.FC<HealthTrackerProps> = ({
  vitals,
  onUpdateVitals,
  iceProfile,
  onUpdateProfile,
  onTriggerSos,
  onOpenTrainer,
  onOpenQuiz,
}) => {
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // New Vital Form State
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [heartRate, setHeartRate] = useState<number>(72);
  const [spo2, setSpo2] = useState<number>(98);
  const [vitalNotes, setVitalNotes] = useState<string>('');

  // Interactive Pulse Tap-Measure Tool
  const [pulseTapTimes, setPulseTapTimes] = useState<number[]>([]);
  const [measuredPulseBpm, setMeasuredPulseBpm] = useState<number | null>(null);
  const [isTappingPulse, setIsTappingPulse] = useState(false);

  // Edit Profile Form State
  const [profileName, setProfileName] = useState(iceProfile.fullName);
  const [profileBirth, setProfileBirth] = useState(iceProfile.birthDate);
  const [profileBlood, setProfileBlood] = useState(iceProfile.bloodType);
  const [profileAllergies, setProfileAllergies] = useState(iceProfile.allergies);
  const [profileConditions, setProfileConditions] = useState(iceProfile.conditions);
  const [profileMeds, setProfileMeds] = useState(iceProfile.medications);
  const [profileOrganDonor, setProfileOrganDonor] = useState(iceProfile.isOrganDonor);
  const [profileNotes, setProfileNotes] = useState(iceProfile.notes);

  const notify = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  // Pulse Tap Measure
  const handlePulseTap = () => {
    const now = performance.now();
    const updated = [...pulseTapTimes, now].slice(-10);
    setPulseTapTimes(updated);
    setIsTappingPulse(true);

    if (updated.length >= 3) {
      const deltas: number[] = [];
      for (let i = 1; i < updated.length; i++) {
        deltas.push(updated[i] - updated[i - 1]);
      }
      const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      if (avgDelta > 300 && avgDelta < 2000) {
        const bpm = Math.round(60000 / avgDelta);
        setMeasuredPulseBpm(bpm);
        setHeartRate(bpm);
      }
    }
  };

  const resetPulseTap = () => {
    setPulseTapTimes([]);
    setMeasuredPulseBpm(null);
    setIsTappingPulse(false);
  };

  // Save new vital entry
  const handleAddVital = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: VitalEntry = {
      id: `v-${Date.now()}`,
      date: new Date().toISOString(),
      heartRate: Number(heartRate),
      systolicBp: Number(systolic),
      diastolicBp: Number(diastolic),
      oxygenSaturation: spo2 ? Number(spo2) : undefined,
      notes: vitalNotes.trim() || undefined,
    };

    const updated = [newEntry, ...vitals];
    saveStoredVitals(updated);
    onUpdateVitals(updated);
    setShowAddModal(false);
    setVitalNotes('');
    resetPulseTap();
    notify('Vital entry recorded successfully');
  };

  const handleDeleteVital = (id: string) => {
    const updated = vitals.filter((v) => v.id !== id);
    saveStoredVitals(updated);
    onUpdateVitals(updated);
    notify('Entry deleted');
  };

  // Save Medical Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: IceProfile = {
      ...iceProfile,
      fullName: profileName.trim(),
      birthDate: profileBirth,
      bloodType: profileBlood,
      allergies: profileAllergies.trim(),
      conditions: profileConditions.trim(),
      medications: profileMeds.trim(),
      isOrganDonor: profileOrganDonor,
      notes: profileNotes.trim(),
    };
    saveStoredIceProfile(updated);
    onUpdateProfile(updated);
    setShowEditProfileModal(false);
    notify('Medical ID Profile updated');
  };

  // Export report
  const exportHealthSummary = () => {
    const summary = {
      appName: 'ResQHealth Lifesaving & Medical Vitals System',
      exportDate: new Date().toISOString(),
      medicalId: iceProfile,
      vitalMeasurements: vitals,
      cprTrainingSessions: getStoredCprHistory(),
      cprQuizAssessments: getStoredCprQuizScores(),
      emergencyContacts: iceProfile.contacts,
      emergencySosNumbers: iceProfile.sosNumbers,
    };
    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ResQHealth_Complete_Export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Complete health & CPR data downloaded');
  };

  // Calculate Blood Pressure Category (AHA guidelines)
  const getBpCategory = (sys: number, dia: number) => {
    if (sys > 180 || dia > 120) {
      return { label: 'Hypertensive Crisis', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    }
    if (sys >= 140 || dia >= 90) {
      return { label: 'Stage 2 Hypertension', color: 'text-amber-800 bg-amber-50 border-amber-200' };
    }
    if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
      return { label: 'Stage 1 Hypertension', color: 'text-amber-700 bg-amber-50/70 border-amber-200' };
    }
    if (sys >= 120 && sys <= 129 && dia < 80) {
      return { label: 'Elevated BP', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    }
    return { label: 'Normal Blood Pressure', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  const latestVital = vitals[0] || {
    id: '0',
    date: new Date().toISOString(),
    heartRate: 72,
    systolicBp: 120,
    diastolicBp: 80,
    oxygenSaturation: 98,
  };

  const latestBpCategory = getBpCategory(latestVital.systolicBp, latestVital.diastolicBp);

  // SVG Chart points calculation for 7-day trend
  const trendEntries = [...vitals].slice(0, 7).reverse();
  const maxSys = 160;
  const minDia = 60;
  const chartHeight = 120;
  const chartWidth = 320;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Cardiovascular Health & Vitals</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Personal Health & Vitals Tracker
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
            Monitor resting heart rate, blood pressure trends, oxygen levels, and maintain your Emergency Medical ID card.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={exportHealthSummary}
            className="px-3.5 py-2 bg-white text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Log Today's Vitals</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Blood Pressure Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Blood Pressure
            </span>
            <Activity className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {latestVital.systolicBp}/{latestVital.diastolicBp}
            </span>
            <span className="text-xs text-slate-500">mmHg</span>
          </div>
          <div className={`text-[11px] font-semibold px-2 py-0.5 rounded border inline-block ${latestBpCategory.color}`}>
            {latestBpCategory.label}
          </div>
        </div>

        {/* Resting Heart Rate */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Resting Pulse
            </span>
            <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {latestVital.heartRate}
            </span>
            <span className="text-xs text-slate-500">BPM</span>
          </div>
          <span className="text-[11px] font-medium text-slate-600">
            {latestVital.heartRate < 60
              ? 'Bradycardia (<60)'
              : latestVital.heartRate <= 100
              ? 'Healthy Resting (60-100)'
              : 'Elevated (>100)'}
          </span>
        </div>

        {/* Blood Oxygen SpO2 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Oxygen SpO₂
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {latestVital.oxygenSaturation ?? 98}%
            </span>
          </div>
          <span className="text-[11px] font-medium text-emerald-700">
            Normal Aeration (≥95%)
          </span>
        </div>

        {/* Emergency Medical ID Snapshot */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Medical ID Card
              </span>
              <User className="w-4 h-4 text-slate-700" />
            </div>
            <p className="text-sm font-bold text-slate-900 mt-1">{iceProfile.fullName}</p>
            <p className="text-xs text-slate-600">Blood: <strong className="text-rose-600">{iceProfile.bloodType}</strong> · {iceProfile.isOrganDonor ? 'Donor' : 'Non-donor'}</p>
          </div>
          <button
            onClick={() => setShowEditProfileModal(true)}
            className="text-xs text-rose-600 font-semibold hover:underline text-left cursor-pointer"
          >
            Edit Medical ID Profile →
          </button>
        </div>
      </div>

      {/* Interactive Pulse Tap-Measure Tool */}
      <div className="bg-rose-50/70 rounded-2xl border border-rose-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
            <Heart className="w-4 h-4 fill-rose-600 text-rose-600" />
            Interactive Heart Rate Tap-Sensor
          </span>
          <h3 className="text-lg font-bold text-slate-900">
            Measure your pulse right now
          </h3>
          <p className="text-xs text-slate-600 max-w-lg">
            Place two fingers on your neck (carotid) or wrist (radial) pulse. Tap the sensor pad in sync with each heartbeat for 5-8 beats to measure your live BPM.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {measuredPulseBpm && (
            <div className="text-center p-3 bg-white rounded-xl border border-rose-200 shadow-xs">
              <span className="text-2xl font-black text-rose-600 font-mono tabular-nums">
                {measuredPulseBpm}
              </span>
              <span className="text-[10px] text-slate-500 block font-medium">Measured BPM</span>
            </div>
          )}

          <button
            onClick={handlePulseTap}
            className="px-6 py-4 bg-rose-600 text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-rose-700 active:scale-95 transition-all shadow-md shadow-rose-600/20 flex flex-col items-center justify-center cursor-pointer select-none"
          >
            <Heart className="w-5 h-5 mb-1 animate-pulse" />
            <span>Tap Heartbeat</span>
            <span className="text-[9px] opacity-80 mt-0.5">({pulseTapTimes.length} beats)</span>
          </button>

          {isTappingPulse && (
            <button
              onClick={resetPulseTap}
              className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* D3 Historical CPR Visualization: Quiz Scores & Training Frequency */}
      <CprD3TrendsVisualization
        onOpenTrainer={onOpenTrainer}
        onOpenQuiz={onOpenQuiz}
      />

      {/* Trend Chart & History Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Visual Trends (SVG Chart) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Blood Pressure & Pulse Trends</h3>
              <p className="text-xs text-slate-500">Last 7 logged measurements</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
                <span className="text-slate-600">Systolic</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                <span className="text-slate-600">Diastolic</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                <span className="text-slate-600">Heart Rate</span>
              </span>
            </div>
          </div>

          {/* SVG Line / Dot Chart */}
          <div className="pt-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 overflow-visible"
            >
              {/* Reference Grid lines */}
              <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="60" x2={chartWidth} y2="60" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="100" x2={chartWidth} y2="100" stroke="#f1f5f9" strokeWidth="1" />

              {/* Connecting Lines */}
              {trendEntries.length > 1 && (
                <>
                  {/* Systolic Line */}
                  <polyline
                    fill="none"
                    stroke="#e11d48"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={trendEntries
                      .map((d, i) => {
                        const x = (i / (trendEntries.length - 1)) * (chartWidth - 40) + 20;
                        const y = chartHeight - ((d.systolicBp - 60) / 110) * chartHeight;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />

                  {/* Diastolic Line */}
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={trendEntries
                      .map((d, i) => {
                        const x = (i / (trendEntries.length - 1)) * (chartWidth - 40) + 20;
                        const y = chartHeight - ((d.diastolicBp - 60) / 110) * chartHeight;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />

                  {/* Heart Rate Line */}
                  <polyline
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    points={trendEntries
                      .map((d, i) => {
                        const x = (i / (trendEntries.length - 1)) * (chartWidth - 40) + 20;
                        const y = chartHeight - ((d.heartRate - 60) / 110) * chartHeight;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                </>
              )}

              {/* Plot Points */}
              {trendEntries.map((d, i) => {
                const x = (i / Math.max(trendEntries.length - 1, 1)) * (chartWidth - 40) + 20;
                const sysY = chartHeight - ((d.systolicBp - 60) / 110) * chartHeight;
                const diaY = chartHeight - ((d.diastolicBp - 60) / 110) * chartHeight;
                const hrY = chartHeight - ((d.heartRate - 60) / 110) * chartHeight;

                return (
                  <g key={d.id}>
                    <circle cx={x} cy={sysY} r="3.5" fill="#e11d48" />
                    <circle cx={x} cy={diaY} r="3.5" fill="#2563eb" />
                    <circle cx={x} cy={hrY} r="2.5" fill="#059669" />
                  </g>
                );
              })}
            </svg>

            {/* Date stamps under chart */}
            <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-2">
              {trendEntries.map((d) => (
                <span key={d.id}>
                  {new Date(d.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Vitals Log History Table */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Vitals Log Records</h3>
            <span className="text-xs text-slate-500">{vitals.length} logs recorded</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {vitals.map((v) => {
              const cat = getBpCategory(v.systolicBp, v.diastolicBp);
              return (
                <div
                  key={v.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-slate-900">
                        {v.systolicBp}/{v.diastolicBp} mmHg
                      </span>
                      <span className="font-mono text-slate-600">
                        · {v.heartRate} BPM
                      </span>
                      {v.oxygenSaturation && (
                        <span className="font-mono text-emerald-700">
                          · {v.oxygenSaturation}% SpO₂
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {new Date(v.date).toLocaleString()}
                      {v.notes && <span className="text-slate-600 italic ml-1">· {v.notes}</span>}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${cat.color}`}>
                      {cat.label}
                    </span>
                    <button
                      onClick={() => handleDeleteVital(v.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Log Today's Vitals Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Log Health Vitals</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddVital} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    min="70"
                    max="240"
                    required
                    value={systolic}
                    onChange={(e) => setSystolic(Number(e.target.value))}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    min="40"
                    max="160"
                    required
                    value={diastolic}
                    onChange={(e) => setDiastolic(Number(e.target.value))}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Resting Heart Rate (BPM)</label>
                  <input
                    type="number"
                    min="40"
                    max="220"
                    required
                    value={heartRate}
                    onChange={(e) => setHeartRate(Number(e.target.value))}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">SpO₂ Oxygen (%)</label>
                  <input
                    type="number"
                    min="70"
                    max="100"
                    value={spo2}
                    onChange={(e) => setSpo2(Number(e.target.value))}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Context Notes</label>
                <input
                  type="text"
                  value={vitalNotes}
                  onChange={(e) => setVitalNotes(e.target.value)}
                  placeholder="e.g. Morning baseline, before taking medication"
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 cursor-pointer"
                >
                  Save Measurement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Medical ID Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Edit Emergency Medical ID</h3>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Blood Type</label>
                  <select
                    value={profileBlood}
                    onChange={(e) => setProfileBlood(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono font-bold"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Known Allergies</label>
                <input
                  type="text"
                  value={profileAllergies}
                  onChange={(e) => setProfileAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Peanuts, Latex"
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Medical Conditions</label>
                <input
                  type="text"
                  value={profileConditions}
                  onChange={(e) => setProfileConditions(e.target.value)}
                  placeholder="e.g. Type 1 Diabetes, Arrhythmia, Asthma"
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Current Medications & Dosages</label>
                <input
                  type="text"
                  value={profileMeds}
                  onChange={(e) => setProfileMeds(e.target.value)}
                  placeholder="e.g. Metoprolol 25mg daily, Aspirin 81mg"
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="organDonorCheck"
                  checked={profileOrganDonor}
                  onChange={(e) => setProfileOrganDonor(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="organDonorCheck" className="text-xs text-slate-700 font-medium">
                  Designated Organ Donor
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
