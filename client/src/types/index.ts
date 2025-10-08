export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'FOUNDER' | 'THERAPIST' | 'ADMIN';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  userId: string;
  ventureStage: 'IDEA' | 'PRESEED' | 'SEED' | 'SERIES_A' | 'GROWTH' | 'PRE_IPO' | 'IPO';
  primaryStressors: string[];
  avatarArchetype: 'VISIONARY' | 'OPERATOR' | 'RAINMAKER' | 'CRAFTSMAN' | 'GUARDIAN' | 'EXPLORER' | 'STABILIZER' | 'CATALYST';
  sleepHours?: number;
  workloadHrsWk?: number;
  timezone: string;
  consentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EISnapshot {
  id: string;
  userId: string;
  score: number;
  focusEfficiency: number;
  recoveryLatency: number;
  decisionClarity: number;
  emotionRegulation: number;
  supportUtilization: number;
  strategicMomentum: number;
  state: 'FIGHT' | 'FLIGHT' | 'FREEZE' | 'REGULATED';
  metadata: Record<string, any>;
  createdAt: string;
}

export interface ProgramAssignment {
  id: string;
  userId: string;
  programCode: string;
  currentDay: number;
  totalDays: number;
  startAt: string;
  completedAt?: string;
  status: 'ACTIVE' | 'PAUSED' | 'DONE';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Journal {
  id: string;
  userId: string;
  title?: string;
  bodyCipher: string;
  tags: string[];
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ZenSession {
  id: string;
  userId: string;
  duration: number;
  completed: boolean;
  calendarEventId?: string;
  breathingPattern: string;
  ambientSound?: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  provider: string;
  planType: 'STARTER_5' | 'PRO_99';
  stripeSubscriptionId?: string;
  status: 'ACTIVE' | 'CANCELED' | 'INCOMPLETE' | 'PAST_DUE';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt?: string;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarWorkload {
  totalEvents: number;
  totalBusyMinutes: number;
  calendarDensity: number;
  eveningEvents: number;
  longestBlockHours: number;
  averageDailyEvents: number;
  nextWeekEvents: any[];
}
