import {
  VitalEntry,
  IceProfile,
  CprPracticeSession,
  CprQuizScoreRecord,
  SosAlertRecord,
  CustomSosNumber,
  EmergencyContact,
} from '../types/health';

const VITALS_STORAGE_KEY = 'resqhealth_vitals_v1';
const ICE_STORAGE_KEY = 'resqhealth_ice_v1';
const CPR_HISTORY_KEY = 'resqhealth_cpr_history_v1';
const SOS_LOGS_KEY = 'resqhealth_sos_logs_v1';

export const DEFAULT_SOS_NUMBERS: CustomSosNumber[] = [
  {
    id: 'sos-1',
    label: 'Police / Fire / EMS Dispatch',
    number: '911',
    description: 'National emergency services (North America)',
    isPrimary: true,
  },
  {
    id: 'sos-2',
    label: 'European Emergency (112)',
    number: '112',
    description: 'Standard EU & international emergency number',
    isPrimary: false,
  },
  {
    id: 'sos-3',
    label: 'UK Emergency (999)',
    number: '999',
    description: 'United Kingdom emergency services',
    isPrimary: false,
  },
];

const defaultIceProfile: IceProfile = {
  fullName: 'Alex Vance',
  birthDate: '1988-06-14',
  bloodType: 'O+',
  allergies: 'Penicillin, Shellfish',
  conditions: 'Mild asthma, Controlled hypertension',
  medications: 'Lisinopril 10mg morning, Albuterol inhaler PRN',
  isOrganDonor: true,
  notes: 'Wears medical alert bracelet on left wrist.',
  customMessageTemplate:
    'EMERGENCY ALERT: This is {name}. I require immediate medical/emergency assistance. My current location is: {maps_link}. Please send help or contact emergency dispatch.',
  sosNumbers: DEFAULT_SOS_NUMBERS,
  contacts: [
    {
      id: 'c1',
      name: 'Sarah Vance',
      relationship: 'Spouse',
      phone: '+1 (555) 234-8901',
      isPrimary: true,
      channel: 'both',
      customNotes: 'Has house keys and medical proxy.',
    },
    {
      id: 'c2',
      name: 'Marcus Vance',
      relationship: 'Brother',
      phone: '+1 (555) 871-3329',
      isPrimary: false,
      channel: 'sms',
      customNotes: 'Lives 10 minutes away.',
    },
    {
      id: 'c3',
      name: 'Dr. Robert Chen (Cardiologist)',
      relationship: 'Physician',
      phone: '+1 (555) 492-1100',
      isPrimary: false,
      channel: 'call',
      customNotes: 'Memorial Health Heart Clinic.',
    },
  ],
};

const defaultVitals: VitalEntry[] = [
  {
    id: 'v-1',
    date: new Date(Date.now() - 6 * 86400000).toISOString(),
    heartRate: 72,
    systolicBp: 122,
    diastolicBp: 80,
    oxygenSaturation: 98,
    notes: 'Morning reading before coffee.',
  },
  {
    id: 'v-2',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    heartRate: 74,
    systolicBp: 124,
    diastolicBp: 82,
    oxygenSaturation: 99,
    notes: 'Post light jog.',
  },
  {
    id: 'v-3',
    date: new Date(Date.now() - 4 * 86400000).toISOString(),
    heartRate: 70,
    systolicBp: 119,
    diastolicBp: 78,
    oxygenSaturation: 98,
    notes: 'Resting weekend measurement.',
  },
  {
    id: 'v-4',
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    heartRate: 68,
    systolicBp: 118,
    diastolicBp: 76,
    oxygenSaturation: 99,
    notes: 'After evening meditation.',
  },
  {
    id: 'v-5',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    heartRate: 75,
    systolicBp: 126,
    diastolicBp: 83,
    oxygenSaturation: 98,
    notes: 'Busy workday reading.',
  },
  {
    id: 'v-6',
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    heartRate: 71,
    systolicBp: 121,
    diastolicBp: 79,
    oxygenSaturation: 99,
    notes: 'Standard morning check.',
  },
  {
    id: 'v-7',
    date: new Date().toISOString(),
    heartRate: 72,
    systolicBp: 120,
    diastolicBp: 78,
    oxygenSaturation: 99,
    notes: 'Optimal reading today.',
  },
];

export function getStoredVitals(): VitalEntry[] {
  try {
    const raw = localStorage.getItem(VITALS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(VITALS_STORAGE_KEY, JSON.stringify(defaultVitals));
      return defaultVitals;
    }
    return JSON.parse(raw);
  } catch {
    return defaultVitals;
  }
}

export function saveStoredVitals(vitals: VitalEntry[]): void {
  try {
    localStorage.setItem(VITALS_STORAGE_KEY, JSON.stringify(vitals));
  } catch (err) {
    console.error('Failed to save vitals', err);
  }
}

export function getStoredIceProfile(): IceProfile {
  try {
    const raw = localStorage.getItem(ICE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ICE_STORAGE_KEY, JSON.stringify(defaultIceProfile));
      return defaultIceProfile;
    }
    const parsed = JSON.parse(raw);
    // ensure backward compatibility if fields added
    return {
      ...defaultIceProfile,
      ...parsed,
      contacts: parsed.contacts || defaultIceProfile.contacts,
      sosNumbers: parsed.sosNumbers || defaultIceProfile.sosNumbers,
    };
  } catch {
    return defaultIceProfile;
  }
}

export function saveStoredIceProfile(profile: IceProfile): void {
  try {
    localStorage.setItem(ICE_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save ICE profile', err);
  }
}

const CPR_QUIZ_KEY = 'resqhealth_cpr_quiz_scores_v1';

const defaultCprHistory: CprPracticeSession[] = [
  {
    id: 'cpr-s-1',
    timestamp: Date.now() - 6 * 86400000,
    recipientType: 'adult',
    durationSeconds: 45,
    totalCompressions: 60,
    averageBpm: 102,
    targetAccuracyPercent: 72,
    completedCycles: 2,
  },
  {
    id: 'cpr-s-2',
    timestamp: Date.now() - 5 * 86400000,
    recipientType: 'adult',
    durationSeconds: 65,
    totalCompressions: 90,
    averageBpm: 106,
    targetAccuracyPercent: 78,
    completedCycles: 3,
  },
  {
    id: 'cpr-s-3',
    timestamp: Date.now() - 4 * 86400000,
    recipientType: 'child',
    durationSeconds: 85,
    totalCompressions: 120,
    averageBpm: 112,
    targetAccuracyPercent: 84,
    completedCycles: 4,
  },
  {
    id: 'cpr-s-4',
    timestamp: Date.now() - 3 * 86400000,
    recipientType: 'adult',
    durationSeconds: 105,
    totalCompressions: 150,
    averageBpm: 110,
    targetAccuracyPercent: 88,
    completedCycles: 5,
  },
  {
    id: 'cpr-s-5',
    timestamp: Date.now() - 2 * 86400000,
    recipientType: 'hands_only',
    durationSeconds: 70,
    totalCompressions: 125,
    averageBpm: 111,
    targetAccuracyPercent: 92,
    completedCycles: 4,
  },
  {
    id: 'cpr-s-6',
    timestamp: Date.now() - 1 * 86400000,
    recipientType: 'adult',
    durationSeconds: 125,
    totalCompressions: 180,
    averageBpm: 110,
    targetAccuracyPercent: 95,
    completedCycles: 6,
  },
  {
    id: 'cpr-s-7',
    timestamp: Date.now() - 2 * 3600000,
    recipientType: 'adult',
    durationSeconds: 100,
    totalCompressions: 150,
    averageBpm: 110,
    targetAccuracyPercent: 96,
    completedCycles: 5,
  },
];

const defaultQuizScores: CprQuizScoreRecord[] = [
  {
    id: 'quiz-1',
    timestamp: Date.now() - 6 * 86400000,
    score: 3,
    totalQuestions: 5,
    percent: 60,
    passed: false,
  },
  {
    id: 'quiz-2',
    timestamp: Date.now() - 4 * 86400000,
    score: 4,
    totalQuestions: 5,
    percent: 80,
    passed: true,
  },
  {
    id: 'quiz-3',
    timestamp: Date.now() - 2 * 86400000,
    score: 4,
    totalQuestions: 5,
    percent: 80,
    passed: true,
  },
  {
    id: 'quiz-4',
    timestamp: Date.now() - 4 * 3600000,
    score: 5,
    totalQuestions: 5,
    percent: 100,
    passed: true,
  },
];

export function getStoredCprHistory(): CprPracticeSession[] {
  try {
    const raw = localStorage.getItem(CPR_HISTORY_KEY);
    if (!raw) {
      localStorage.setItem(CPR_HISTORY_KEY, JSON.stringify(defaultCprHistory));
      return defaultCprHistory;
    }
    return JSON.parse(raw);
  } catch {
    return defaultCprHistory;
  }
}

export function saveCprSession(session: CprPracticeSession): void {
  try {
    const existing = getStoredCprHistory();
    const updated = [session, ...existing].slice(0, 30);
    localStorage.setItem(CPR_HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save CPR session', err);
  }
}

export function getStoredCprQuizScores(): CprQuizScoreRecord[] {
  try {
    const raw = localStorage.getItem(CPR_QUIZ_KEY);
    if (!raw) {
      localStorage.setItem(CPR_QUIZ_KEY, JSON.stringify(defaultQuizScores));
      return defaultQuizScores;
    }
    return JSON.parse(raw);
  } catch {
    return defaultQuizScores;
  }
}

export function saveCprQuizScore(record: CprQuizScoreRecord): void {
  try {
    const existing = getStoredCprQuizScores();
    const updated = [record, ...existing].slice(0, 30);
    localStorage.setItem(CPR_QUIZ_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save quiz score', err);
  }
}

export function getStoredSosAlertLogs(): SosAlertRecord[] {
  try {
    const raw = localStorage.getItem(SOS_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logSosAlert(record: SosAlertRecord): void {
  try {
    const existing = getStoredSosAlertLogs();
    const updated = [record, ...existing].slice(0, 50);
    localStorage.setItem(SOS_LOGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to log SOS alert', err);
  }
}
