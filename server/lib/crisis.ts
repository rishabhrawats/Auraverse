// Crisis language detection and resource management
// This module handles crisis detection in user input and provides appropriate resources

export interface CrisisResource {
  id: string;
  name: string;
  phone: string;
  text?: string;
  website?: string;
  description: string;
  country: string;
  available: string;
}

// Crisis keywords and phrases for detection
const CRISIS_KEYWORDS = [
  // Direct self-harm
  'kill myself', 'suicide', 'suicidal', 'end my life', 'take my life',
  'hurt myself', 'harm myself', 'cut myself', 'self harm',
  
  // Ideation
  'want to die', 'wish I was dead', 'better off dead', 'no point living',
  'can\'t go on', 'life isn\'t worth', 'everyone better without me',
  
  // Method-related (be careful with false positives)
  'pills to die', 'jump off', 'hanging myself', 'gun to head',
  
  // Crisis states
  'completely hopeless', 'nothing matters', 'can\'t take it anymore',
  'overwhelming pain', 'unbearable', 'give up entirely'
];

const CRISIS_PHRASES_REGEX = [
  /i\s+(want|need|have)\s+to\s+(die|kill\s+myself)/i,
  /thinking\s+about\s+(dying|suicide|killing\s+myself)/i,
  /plan\s+to\s+(hurt|kill)\s+myself/i,
  /no\s+reason\s+to\s+(live|go\s+on|continue)/i,
  /world\s+(better|safer)\s+without\s+me/i
];

// Default crisis resources (US-focused, expandable)
const CRISIS_RESOURCES: CrisisResource[] = [
  {
    id: 'nspl',
    name: 'National Suicide Prevention Lifeline',
    phone: '988',
    text: 'Text 988',
    website: 'https://suicidepreventionlifeline.org',
    description: '24/7 crisis support for people in suicidal crisis or emotional distress',
    country: 'US',
    available: '24/7'
  },
  {
    id: 'crisis-text',
    name: 'Crisis Text Line',
    phone: '',
    text: 'Text HOME to 741741',
    website: 'https://crisistextline.org',
    description: '24/7 text-based crisis support',
    country: 'US',
    available: '24/7'
  },
  {
    id: 'trevor',
    name: 'The Trevor Project',
    phone: '1-866-488-7386',
    text: 'Text START to 678678',
    website: 'https://thetrevorproject.org',
    description: '24/7 crisis support for LGBTQ+ young people',
    country: 'US',
    available: '24/7'
  },
  {
    id: 'trans-lifeline',
    name: 'Trans Lifeline',
    phone: '877-565-8860',
    website: 'https://translifeline.org',
    description: 'Crisis support for transgender people',
    country: 'US',
    available: 'Varies'
  },
  {
    id: 'international',
    name: 'International Association for Suicide Prevention',
    phone: '',
    website: 'https://www.iasp.info/resources/Crisis_Centres',
    description: 'Crisis centers worldwide',
    country: 'International',
    available: 'Varies by location'
  }
];

export class CrisisDetector {
  private resources: CrisisResource[];
  
  constructor(customResources?: CrisisResource[]) {
    this.resources = customResources || CRISIS_RESOURCES;
  }

  // Detect crisis language in text
  detectCrisis(text: string): {
    isCrisis: boolean;
    confidence: 'low' | 'medium' | 'high';
    matchedKeywords: string[];
    resources: CrisisResource[];
  } {
    if (!text || text.length === 0) {
      return {
        isCrisis: false,
        confidence: 'low',
        matchedKeywords: [],
        resources: []
      };
    }

    const normalizedText = text.toLowerCase().trim();
    const matchedKeywords: string[] = [];
    let confidence: 'low' | 'medium' | 'high' = 'low';

    // Check direct keywords
    for (const keyword of CRISIS_KEYWORDS) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }

    // Check regex patterns (higher confidence)
    let regexMatches = 0;
    for (const pattern of CRISIS_PHRASES_REGEX) {
      if (pattern.test(normalizedText)) {
        regexMatches++;
        matchedKeywords.push('phrase pattern match');
      }
    }

    // Determine confidence and crisis status
    if (regexMatches > 0 || matchedKeywords.length >= 3) {
      confidence = 'high';
    } else if (matchedKeywords.length >= 2) {
      confidence = 'medium';
    } else if (matchedKeywords.length >= 1) {
      confidence = 'low';
    }

    const isCrisis = confidence === 'high' || 
                    (confidence === 'medium' && matchedKeywords.length >= 2);

    return {
      isCrisis,
      confidence,
      matchedKeywords,
      resources: isCrisis ? this.resources : []
    };
  }

  // Get resources by country/region
  getResourcesByCountry(country: string): CrisisResource[] {
    return this.resources.filter(r => 
      r.country === country || r.country === 'International'
    );
  }

  // Log crisis detection (for monitoring, not storage)
  logCrisisDetection(detection: {
    isCrisis: boolean;
    confidence: string;
    userId?: string;
    timestamp: Date;
  }): void {
    // Log to monitoring system but DO NOT store the content
    console.log('Crisis detection event:', {
      isCrisis: detection.isCrisis,
      confidence: detection.confidence,
      userId: detection.userId ? 'user_' + detection.userId.slice(-4) : 'anonymous',
      timestamp: detection.timestamp.toISOString()
    });
    
    // In production, send to monitoring service
    // But never store the actual text content
  }
}

// Singleton instance
export const crisisDetector = new CrisisDetector();

// Middleware for crisis detection in API requests
import { Request, Response, NextFunction } from 'express';

export function crisisDetectionMiddleware(textField: string = 'content') {
  return (req: Request, res: Response, next: NextFunction) => {
    const text = req.body[textField];
    
    if (text && typeof text === 'string') {
      const detection = crisisDetector.detectCrisis(text);
      
      if (detection.isCrisis) {
        // Log detection event
        crisisDetector.logCrisisDetection({
          isCrisis: true,
          confidence: detection.confidence,
          userId: (req as any).user?.id,
          timestamp: new Date()
        });

        // Return crisis resources immediately
        return res.status(200).json({
          crisis: true,
          message: 'We detected that you may be in crisis. Please reach out for immediate help.',
          resources: detection.resources,
          confidence: detection.confidence
        });
      }
    }
    
    next();
  };
}

// Helper to format resources for display
export function formatCrisisResources(resources: CrisisResource[]): {
  immediate: CrisisResource[];
  additional: CrisisResource[];
} {
  return {
    immediate: resources.filter(r => r.id === 'nspl' || r.id === 'crisis-text'),
    additional: resources.filter(r => r.id !== 'nspl' && r.id !== 'crisis-text')
  };
}
