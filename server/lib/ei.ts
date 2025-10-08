import { storage } from '../storage';
import type { InsertEISnapshot } from '@shared/schema';

export interface DomainSignals {
  // Focus metrics
  timeOnTask?: number; // minutes actually focused vs planned
  plannedTime?: number; // planned focus time
  focusRating?: number; // 1-5 subjective rating
  
  // Recovery metrics
  stressEvents?: number; // number of stress spikes
  recoveryTimes?: number[]; // time to regulate after each spike (minutes)
  
  // Decision metrics
  decisionsMade?: number;
  indecisionMarkers?: number; // times user reported feeling stuck
  clarityRating?: number; // 1-5 self-rating
  
  // Emotion regulation
  moodVariability?: number; // variance in mood ratings
  ruminationMinutes?: number; // time spent in rumination
  regulationRating?: number; // 1-5 self-rating
  
  // Support utilization
  journalEntries?: number; // entries this period
  practiceMinutes?: number; // therapeutic practice time
  programStepsCompleted?: number;
  
  // Strategic momentum
  importantTasksCompleted?: number; // "one important thing" per week
  strategicRating?: number; // 1-5 progress rating
  
  // Calendar context
  calendarDensity?: number; // % of time scheduled
  eveningEvents?: number;
  peakBlockHours?: number;
}

export interface EIResult {
  score: number;
  focusEfficiency: number;
  recoveryLatency: number;
  decisionClarity: number;
  emotionRegulation: number;
  supportUtilization: number;
  strategicMomentum: number;
  state: 'FIGHT' | 'FLIGHT' | 'FREEZE' | 'REGULATED';
}

export function computeEI(signals: DomainSignals): EIResult {
  // Focus Efficiency (0-100)
  let focusEfficiency = 75; // baseline
  
  if (signals.timeOnTask && signals.plannedTime) {
    const efficiency = Math.min(signals.timeOnTask / signals.plannedTime, 1.2);
    focusEfficiency = Math.round(efficiency * 80); // cap at 96 (1.2 * 80)
  }
  
  if (signals.focusRating) {
    const ratingBonus = ((signals.focusRating - 3) / 2) * 20; // -20 to +20
    focusEfficiency = Math.min(100, Math.max(0, focusEfficiency + ratingBonus));
  }

  // Recovery Latency (0-100, transformed so higher is better)
  let recoveryLatency = 80; // baseline (good recovery)
  
  if (signals.recoveryTimes && signals.recoveryTimes.length > 0) {
    const avgRecovery = signals.recoveryTimes.reduce((a, b) => a + b) / signals.recoveryTimes.length;
    // Transform: 0-30 min = 100-70, 30-120 min = 70-20, >120 min = 20-0
    if (avgRecovery <= 30) {
      recoveryLatency = Math.round(100 - (avgRecovery / 30) * 30);
    } else if (avgRecovery <= 120) {
      recoveryLatency = Math.round(70 - ((avgRecovery - 30) / 90) * 50);
    } else {
      recoveryLatency = Math.round(20 - Math.min((avgRecovery - 120) / 60, 1) * 20);
    }
  }

  // Decision Clarity (0-100)
  let decisionClarity = 70; // baseline
  
  if (signals.clarityRating) {
    decisionClarity = Math.round((signals.clarityRating / 5) * 100);
  }
  
  if (signals.indecisionMarkers) {
    const penalty = Math.min(signals.indecisionMarkers * 5, 30);
    decisionClarity = Math.max(0, decisionClarity - penalty);
  }

  // Emotion Regulation (0-100)
  let emotionRegulation = 75; // baseline
  
  if (signals.regulationRating) {
    emotionRegulation = Math.round((signals.regulationRating / 5) * 100);
  }
  
  if (signals.moodVariability) {
    // Higher variability = lower regulation
    const penalty = Math.min(signals.moodVariability * 10, 40);
    emotionRegulation = Math.max(0, emotionRegulation - penalty);
  }

  // Support Utilization (0-100)
  let supportUtilization = 60; // baseline
  
  let supportScore = 0;
  if (signals.journalEntries) {
    supportScore += Math.min(signals.journalEntries * 15, 30); // max 30 from journaling
  }
  if (signals.practiceMinutes) {
    supportScore += Math.min((signals.practiceMinutes / 30) * 25, 40); // max 40 from practice
  }
  if (signals.programStepsCompleted) {
    supportScore += Math.min(signals.programStepsCompleted * 10, 30); // max 30 from programs
  }
  
  supportUtilization = Math.min(100, supportScore);

  // Strategic Momentum (0-100)
  let strategicMomentum = 65; // baseline
  
  if (signals.importantTasksCompleted !== undefined) {
    // 1 important task per week = 85 points, 0 = 40, 2+ = 95+
    if (signals.importantTasksCompleted === 0) {
      strategicMomentum = 40;
    } else if (signals.importantTasksCompleted === 1) {
      strategicMomentum = 85;
    } else {
      strategicMomentum = Math.min(100, 85 + (signals.importantTasksCompleted - 1) * 15);
    }
  }
  
  if (signals.strategicRating) {
    const ratingAdjust = ((signals.strategicRating - 3) / 2) * 15; // -15 to +15
    strategicMomentum = Math.min(100, Math.max(0, strategicMomentum + ratingAdjust));
  }

  // Calendar context adjustments
  if (signals.calendarDensity) {
    if (signals.calendarDensity > 70) {
      // High meeting load impacts focus and recovery
      focusEfficiency = Math.max(0, focusEfficiency - (signals.calendarDensity - 70));
      recoveryLatency = Math.max(0, recoveryLatency - (signals.calendarDensity - 70) * 0.5);
    }
  }
  
  if (signals.eveningEvents && signals.eveningEvents > 2) {
    // Evening events impact recovery
    recoveryLatency = Math.max(0, recoveryLatency - (signals.eveningEvents - 2) * 5);
  }

  // Overall EI Score (weighted average)
  const weights = {
    focusEfficiency: 0.2,
    recoveryLatency: 0.15,
    decisionClarity: 0.15,
    emotionRegulation: 0.2,
    supportUtilization: 0.15,
    strategicMomentum: 0.15
  };

  const score = Math.round(
    focusEfficiency * weights.focusEfficiency +
    recoveryLatency * weights.recoveryLatency +
    decisionClarity * weights.decisionClarity +
    emotionRegulation * weights.emotionRegulation +
    supportUtilization * weights.supportUtilization +
    strategicMomentum * weights.strategicMomentum
  );

  // Determine FFF state based on scores
  let state: 'FIGHT' | 'FLIGHT' | 'FREEZE' | 'REGULATED' = 'REGULATED';
  
  if (score < 40) {
    state = 'FREEZE'; // Very low effectiveness
  } else if (recoveryLatency < 40 && emotionRegulation < 50) {
    state = 'FLIGHT'; // Poor recovery + emotion regulation
  } else if (decisionClarity < 40 && strategicMomentum < 50) {
    state = 'FIGHT'; // Decision paralysis + low momentum
  } else if (score >= 70) {
    state = 'REGULATED'; // Good overall effectiveness
  } else {
    // Mixed state - determine based on primary weakness
    const minScore = Math.min(focusEfficiency, recoveryLatency, decisionClarity, emotionRegulation);
    if (minScore === recoveryLatency) {
      state = 'FLIGHT';
    } else if (minScore === decisionClarity) {
      state = 'FIGHT';
    } else {
      state = 'FREEZE';
    }
  }

  return {
    score,
    focusEfficiency: Math.round(focusEfficiency),
    recoveryLatency: Math.round(recoveryLatency),
    decisionClarity: Math.round(decisionClarity),
    emotionRegulation: Math.round(emotionRegulation),
    supportUtilization: Math.round(supportUtilization),
    strategicMomentum: Math.round(strategicMomentum),
    state
  };
}

// Helper to create EI snapshot from current user context
export async function generateEISnapshot(userId: string, signals: DomainSignals): Promise<InsertEISnapshot> {
  const result = computeEI(signals);
  
  return {
    userId,
    score: result.score,
    focusEfficiency: result.focusEfficiency,
    recoveryLatency: result.recoveryLatency,
    decisionClarity: result.decisionClarity,
    emotionRegulation: result.emotionRegulation,
    supportUtilization: result.supportUtilization,
    strategicMomentum: result.strategicMomentum,
    state: result.state
  };
}

// Get EI insights and recommendations
export function getEIInsights(snapshot: EIResult, calendarData?: any): {
  insights: string[];
  recommendations: string[];
  focusAreas: string[];
} {
  const insights: string[] = [];
  const recommendations: string[] = [];
  const focusAreas: string[] = [];

  // Identify strengths and weaknesses
  const scores = {
    'Focus Efficiency': snapshot.focusEfficiency,
    'Recovery Latency': snapshot.recoveryLatency,
    'Decision Clarity': snapshot.decisionClarity,
    'Emotion Regulation': snapshot.emotionRegulation,
    'Support Utilization': snapshot.supportUtilization,
    'Strategic Momentum': snapshot.strategicMomentum
  };

  const sorted = Object.entries(scores).sort(([,a], [,b]) => b - a);
  const strengths = sorted.slice(0, 2);
  const weaknesses = sorted.slice(-2);

  // Generate insights
  insights.push(`Your effectiveness score is ${snapshot.score}, indicating ${
    snapshot.score >= 80 ? 'excellent' : 
    snapshot.score >= 65 ? 'good' : 
    snapshot.score >= 50 ? 'moderate' : 'low'
  } performance.`);

  insights.push(`Your strongest areas are ${strengths.map(([name]) => name).join(' and ')}.`);
  
  if (weaknesses.some(([, score]) => score < 60)) {
    insights.push(`Consider focusing on ${weaknesses.map(([name]) => name).join(' and ')}.`);
  }

  // State-specific insights
  switch (snapshot.state) {
    case 'REGULATED':
      insights.push('You\'re in a regulated state with good balance across effectiveness areas.');
      break;
    case 'FIGHT':
      insights.push('You may be experiencing decision paralysis or strategic stagnation.');
      recommendations.push('Try the 2-minute rule: if something takes less than 2 minutes, do it now.');
      break;
    case 'FLIGHT':
      insights.push('You may be experiencing stress with slower recovery times.');
      recommendations.push('Consider scheduling more recovery time between high-intensity activities.');
      break;
    case 'FREEZE':
      insights.push('You may be feeling overwhelmed or stuck.');
      recommendations.push('Focus on small, achievable wins to build momentum.');
      break;
  }

  // Calendar-based recommendations
  if (calendarData) {
    if (calendarData.density > 70) {
      recommendations.push('Your calendar shows high density. Consider scheduling buffer time between meetings.');
    }
    if (calendarData.eveningEvents > 2) {
      recommendations.push('Multiple evening events detected. Plan for extra recovery time.');
    }
    if (calendarData.peakBlockHours > 3) {
      recommendations.push(`Your longest meeting block is ${calendarData.peakBlockHours} hours. Consider a Zen session afterward.`);
    }
  }

  // Focus areas based on low scores
  Object.entries(scores).forEach(([area, score]) => {
    if (score < 60) {
      focusAreas.push(area);
    }
  });

  return { insights, recommendations, focusAreas };
}
