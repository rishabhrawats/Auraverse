// Tier-based feature configuration for AuraVerse AI

export type PlanTier = 'BASIC_5' | 'MEDIUM_29' | 'EXCLUSIVE_99';

export interface TierFeatures {
  // Core Features
  eiTracking: boolean;
  basicPrograms: boolean;
  aiOracle: boolean;
  journaling: boolean;
  zenMode: boolean;
  
  // Advanced Features
  advancedPrograms: boolean;
  calendarIntegration: boolean;
  aiJournalSummaries: boolean;
  insightsAnalytics: boolean;
  
  // Exclusive Features
  priorityAISupport: boolean;
  customPrograms: boolean;
  exportData: boolean;
  unlimitedJournals: boolean;
  
  // Limits
  maxPrograms: number;
  maxJournalsPerMonth: number;
  maxZenSessionsPerDay: number;
  aiQuestionsPerDay: number;
}

export const TIER_FEATURES: Record<PlanTier, TierFeatures> = {
  BASIC_5: {
    // Core Features
    eiTracking: true,
    basicPrograms: true,
    aiOracle: true,
    journaling: true,
    zenMode: true,
    
    // Advanced Features
    advancedPrograms: false,
    calendarIntegration: false,
    aiJournalSummaries: false,
    insightsAnalytics: false,
    
    // Exclusive Features
    priorityAISupport: false,
    customPrograms: false,
    exportData: false,
    unlimitedJournals: false,
    
    // Limits
    maxPrograms: 1,
    maxJournalsPerMonth: 10,
    maxZenSessionsPerDay: 2,
    aiQuestionsPerDay: 5,
  },
  
  MEDIUM_29: {
    // Core Features
    eiTracking: true,
    basicPrograms: true,
    aiOracle: true,
    journaling: true,
    zenMode: true,
    
    // Advanced Features
    advancedPrograms: true,
    calendarIntegration: true,
    aiJournalSummaries: true,
    insightsAnalytics: true,
    
    // Exclusive Features
    priorityAISupport: false,
    customPrograms: false,
    exportData: true,
    unlimitedJournals: false,
    
    // Limits
    maxPrograms: 3,
    maxJournalsPerMonth: 50,
    maxZenSessionsPerDay: 5,
    aiQuestionsPerDay: 20,
  },
  
  EXCLUSIVE_99: {
    // Core Features
    eiTracking: true,
    basicPrograms: true,
    aiOracle: true,
    journaling: true,
    zenMode: true,
    
    // Advanced Features
    advancedPrograms: true,
    calendarIntegration: true,
    aiJournalSummaries: true,
    insightsAnalytics: true,
    
    // Exclusive Features
    priorityAISupport: true,
    customPrograms: true,
    exportData: true,
    unlimitedJournals: true,
    
    // Limits
    maxPrograms: 999, // Unlimited
    maxJournalsPerMonth: 999, // Unlimited
    maxZenSessionsPerDay: 999, // Unlimited
    aiQuestionsPerDay: 999, // Unlimited
  },
};

export const TIER_NAMES: Record<PlanTier, string> = {
  BASIC_5: 'Basic',
  MEDIUM_29: 'Medium',
  EXCLUSIVE_99: 'Exclusive',
};

export const TIER_PRICES: Record<PlanTier, number> = {
  BASIC_5: 5,
  MEDIUM_29: 29,
  EXCLUSIVE_99: 99,
};

export const TIER_DESCRIPTIONS: Record<PlanTier, string> = {
  BASIC_5: 'Essential mental wellness tools for founders',
  MEDIUM_29: 'Advanced features with AI-powered insights',
  EXCLUSIVE_99: 'Complete platform access with priority support',
};

// Helper function to check if a feature is available for a tier
export function hasFeature(tier: PlanTier | undefined, feature: keyof TierFeatures): boolean {
  if (!tier) return false;
  return TIER_FEATURES[tier][feature] as boolean;
}

// Helper function to get feature limit
export function getFeatureLimit(tier: PlanTier | undefined, limit: keyof TierFeatures): number {
  if (!tier) return 0;
  return TIER_FEATURES[tier][limit] as number;
}
