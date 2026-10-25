/**
 * ResQHealth - Core Data Types & Interfaces
 */

export type CprRecipientType = 'adult' | 'child' | 'infant' | 'hands_only';

export interface CprPracticeSession {
  id: string;
  timestamp: number;
  recipientType: CprRecipientType;
  durationSeconds: number;
  totalCompressions: number;
  averageBpm: number;
  targetAccuracyPercent: number; // percentage of compressions within 100-120 bpm
  completedCycles: number;
}

export interface CprQuizScoreRecord {
  id: string;
  timestamp: number;
  score: number; // e.g. 4
  totalQuestions: number; // e.g. 5
  percent: number; // e.g. 80
  passed: boolean;
}

export interface VitalEntry {
  id: string;
  date: string; // ISO string
  heartRate: number; // BPM
  systolicBp: number; // mmHg
  diastolicBp: number; // mmHg
  oxygenSaturation?: number; // %
  notes?: string;
  tags?: string[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
  channel: 'sms' | 'whatsapp' | 'call' | 'both';
  customNotes?: string;
}

export interface CustomSosNumber {
  id: string;
  label: string; // e.g., "National Emergency", "Campus Security", "Local Hospital EMS"
  number: string; // e.g., "911", "+1 (555) 019-2831"
  description?: string;
  isPrimary: boolean;
}

export interface SosAlertRecord {
  id: string;
  timestamp: number;
  triggerMethod: 'manual_button' | 'voice_command' | 'cpr_emergency';
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  mapsUrl: string;
  messageText: string;
  notifiedContactsCount: number;
  contactNames: string[];
  sosNumberDialed?: string;
}

export interface IceProfile {
  fullName: string;
  birthDate: string;
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  allergies: string;
  conditions: string; // e.g. "Asthma, Hypertension"
  medications: string; // e.g. "Aspirin 81mg daily"
  isOrganDonor: boolean;
  notes: string;
  contacts: EmergencyContact[];
  sosNumbers: CustomSosNumber[];
  customMessageTemplate: string;
}

export interface CprStep {
  id: string;
  title: string;
  subtitle: string;
  duration?: string;
  criticalRule: string;
  description: string;
  bullets: string[];
  imageSrc?: string;
  calloutText?: string;
  category: 'assessment' | 'compressions' | 'breaths' | 'aed' | 'recovery' | 'choking';
}

export interface QuizQuestion {
  id: string;
  scenario: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}
