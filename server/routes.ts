import type { Express } from "express";
import { Router } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import Stripe from "stripe";
import { z } from "zod";
import { firestoreStorage as storage } from "./firestore-storage";
import { requireFirebaseAuth } from "./lib/firebase-auth-middleware";
import { insertProfileSchema, insertJournalSchema } from "@shared/schema";
import { generateProgramStep, generateOracleResponse } from "./openai";
import { generateProgramStepFallback, detectCrisisLanguage, generateOracleResponseFallback } from "./anthropic";
import { generateOracleResponseGemini } from "./gemini";
import { createZenModeEvent, getCalendarWorkload, setupCalendarWatch } from "./googleCalendarClient";
import { setupOAuth } from "./lib/oauth";

// Stripe setup - Optional for now
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
}) : null;

// EI Computation Engine
function computeEI(signals: {
  focusData: any[];
  recoveryData: any[];
  decisionData: any[];
  emotionData: any[];
  supportData: any[];
  momentumData: any[];
}): any {
  // Placeholder EI computation - would implement actual algorithm
  const subIndices = {
    focusEfficiency: Math.round(Math.random() * 40 + 60), // 60-100
    recoveryLatency: Math.round(Math.random() * 30 + 50), // 50-80
    decisionClarity: Math.round(Math.random() * 35 + 55), // 55-90
    emotionRegulation: Math.round(Math.random() * 25 + 65), // 65-90
    supportUtilization: Math.round(Math.random() * 40 + 40), // 40-80
    strategicMomentum: Math.round(Math.random() * 20 + 70), // 70-90
  };
  
  const score = Math.round(Object.values(subIndices).reduce((sum, val) => sum + val, 0) / 6);
  
  // Determine FFF state based on score and patterns
  let state: 'FIGHT' | 'FLIGHT' | 'FREEZE' | 'REGULATED' = 'REGULATED';
  if (score < 50) state = 'FREEZE';
  else if (score < 65) state = 'FLIGHT';
  else if (score < 75) state = 'FIGHT';
  
  return {
    score,
    ...subIndices,
    state,
    metadata: {
      computedAt: new Date().toISOString(),
      version: 'v1.0'
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Initialize Passport
  app.use(passport.initialize());
  
  // Setup OAuth (Google & LinkedIn)
  setupOAuth(app);
  
  // Create API router
  const apiRouter = Router();
  
  // Firebase Authentication - sync user to Firestore on first access
  apiRouter.post("/auth/sync", requireFirebaseAuth, async (req: any, res) => {
    try {
      const { name, fullName } = req.body;
      const firebaseUser = req.user;
      
      // Check if user exists in Firestore
      let user = await storage.getUser(firebaseUser.uid);
      
      if (!user) {
        // Create new user in Firestore
        user = await storage.createUser({
          email: firebaseUser.email,
          name: name || fullName || firebaseUser.name || firebaseUser.email.split('@')[0],
          role: 'FOUNDER',
          passwordHash: '' // Not used with Firebase Auth
        });
        
        // Update the user ID to match Firebase UID
        // Note: For Firestore, we'll use the Firebase UID as the document ID
      }
      
      res.json({
        user: {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: user.name || firebaseUser.name,
          role: user.role || 'FOUNDER',
          emailVerified: firebaseUser.emailVerified
        }
      });
    } catch (error: any) {
      console.error('Auth sync error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Legacy routes - kept for backwards compatibility but redirect to Firebase Auth
  apiRouter.post("/auth/register", async (req, res) => {
    res.status(400).json({ 
      error: 'Please use Firebase Authentication', 
      message: 'This endpoint is deprecated. Use Firebase Auth on the frontend.' 
    });
  });
  
  apiRouter.post("/auth/login", async (req, res) => {
    res.status(400).json({ 
      error: 'Please use Firebase Authentication', 
      message: 'This endpoint is deprecated. Use Firebase Auth on the frontend.' 
    });
  });
  
  apiRouter.post("/auth/forgot-password", async (req, res) => {
    res.status(400).json({ 
      error: 'Please use Firebase Authentication', 
      message: 'Use Firebase Auth password reset on the frontend.' 
    });
  });
  
  apiRouter.post("/auth/reset-password", async (req, res) => {
    res.status(400).json({ 
      error: 'Please use Firebase Authentication', 
      message: 'Use Firebase Auth password reset on the frontend.' 
    });
  });
  
  // Authentication middleware - using Firebase Auth
  const requireAuth = requireFirebaseAuth;

  // User profile routes
  apiRouter.get("/me", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      const profile = await storage.getProfile(req.user.id);
      const subscription = await storage.getUserSubscription(req.user.id);
      
      res.json({
        user,
        profile,
        subscription
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.put("/profile", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertProfileSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const profile = await storage.createProfile(validatedData);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Onboarding route
  apiRouter.post("/onboarding/complete", requireAuth, async (req: any, res) => {
    try {
      const onboardingSchema = z.object({
        ventureStage: z.enum(['IDEA', 'PRESEED', 'SEED', 'SERIES_A', 'GROWTH', 'PRE_IPO', 'IPO']),
        primaryStressors: z.array(z.string()),
        avatarArchetype: z.enum(['VISIONARY', 'OPERATOR', 'RAINMAKER', 'CRAFTSMAN', 'GUARDIAN', 'EXPLORER', 'STABILIZER', 'CATALYST']),
        sleepHours: z.number().optional(),
        workloadHrsWk: z.number().optional(),
        timezone: z.string(),
        consent: z.boolean()
      });

      const data = onboardingSchema.parse(req.body);
      
      const profile = await storage.createProfile({
        userId: req.user.id,
        ventureStage: data.ventureStage,
        primaryStressors: data.primaryStressors,
        avatarArchetype: data.avatarArchetype,
        sleepHours: data.sleepHours,
        workloadHrsWk: data.workloadHrsWk,
        timezone: data.timezone,
        consentAt: data.consent ? new Date() : null
      });

      // Create initial EI snapshot
      const initialEI = computeEI({
        focusData: [],
        recoveryData: [],
        decisionData: [],
        emotionData: [],
        supportData: [],
        momentumData: []
      });

      await storage.createEISnapshot({
        userId: req.user.id,
        ...initialEI
      });

      // Assign default program
      const defaultProgram = await storage.createProgramAssignment({
        userId: req.user.id,
        programCode: 'FOUNDERS-FOCUS-7D',
        totalDays: 7,
        startAt: new Date()
      });

      res.json({ profile, defaultProgram });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // EI computation routes
  apiRouter.post("/diagnostic/submit", requireAuth, async (req: any, res) => {
    try {
      const diagnosticData = req.body;
      
      // Process diagnostic responses into EI computation
      const eiResult = computeEI(diagnosticData);
      
      const snapshot = await storage.createEISnapshot({
        userId: req.user.id,
        ...eiResult
      });
      
      res.json(snapshot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.get("/ei/latest", requireAuth, async (req: any, res) => {
    try {
      const snapshot = await storage.getLatestEISnapshot(req.user.id);
      res.json(snapshot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.get("/ei/trend", requireAuth, async (req: any, res) => {
    try {
      const days = parseInt(req.query.window as string) || 28;
      const snapshots = await storage.getEISnapshots(req.user.id, days);
      res.json(snapshots);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Program management routes
  apiRouter.get("/programs", requireAuth, async (req: any, res) => {
    try {
      const programs = await storage.getUserPrograms(req.user.id);
      res.json(programs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post("/programs/assign", requireAuth, async (req: any, res) => {
    try {
      const { programCode } = req.body;
      
      const programMap: Record<string, number> = {
        'FOUNDERS-FOCUS-7D': 7,
        'SLEEP-RESET-10D': 10,
        'CALM-FOR-PITCH-48H': 2,
        'CONFLICT-CONTAIN-3D': 3
      };
      
      const totalDays = programMap[programCode] || 7;
      
      const assignment = await storage.createProgramAssignment({
        userId: req.user.id,
        programCode,
        totalDays,
        startAt: new Date()
      });
      
      res.json(assignment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post("/programs/step/complete", requireAuth, async (req: any, res) => {
    try {
      const { assignmentId, stepId } = req.body;
      
      // Get user profile and calendar context for AI generation
      const profile = await storage.getProfile(req.user.id);
      const assignment = await storage.getProgramAssignment(assignmentId);
      
      if (!profile || !assignment) {
        return res.status(404).json({ error: 'Profile or assignment not found' });
      }

      let calendarContext;
      try {
        const workload = await getCalendarWorkload(req.user.id, 2);
        calendarContext = {
          calendarDensity: workload.calendarDensity,
          eveningEvents: workload.eveningEvents,
          longestBlockHours: workload.longestBlockHours
        };
      } catch (error) {
        console.warn('Calendar context unavailable:', error);
      }

      // Complete current step
      if (stepId) {
        await storage.completeProgramStep(stepId);
      }

      // Generate next step using AI
      try {
        const stepRequest = {
          programCode: assignment.programCode,
          day: (assignment.currentDay || 1) + 1,
          userProfile: {
            avatarArchetype: profile.avatarArchetype,
            ventureStage: profile.ventureStage,
            primaryStressors: profile.primaryStressors,
            currentState: 'REGULATED' // Would get from latest EI
          },
          calendarContext
        };

        let aiResponse;
        try {
          aiResponse = await generateProgramStep(stepRequest);
        } catch (openaiError) {
          console.warn('OpenAI failed, trying Anthropic:', openaiError);
          try {
            aiResponse = await generateProgramStepFallback(stepRequest);
          } catch (anthropicError) {
            console.warn('Both AI providers failed, using default program step');
            // Provide a default program step when both APIs fail
            aiResponse = {
              title: `Day ${stepRequest.day}: Mindful Reflection`,
              steps: [
                'Take 5 deep breaths to center yourself',
                'Reflect on one challenge you faced today',
                'Identify one small action you can take tomorrow',
                'Journal about your feelings and progress',
                'Acknowledge one thing you did well today'
              ],
              reflectionQuestion: 'What did you learn about yourself today?',
              microCelebration: 'You showed up for yourself today - that matters.',
              estimatedDuration: 10
            };
          }
        }

        const nextStep = await storage.createProgramStep({
          assignmentId: assignment.id,
          day: stepRequest.day,
          title: aiResponse.title,
          content: aiResponse.steps.join('\n'),
          aiResponse: JSON.stringify(aiResponse)
        });

        // Update assignment progress
        await storage.updateProgramAssignment(assignmentId, {
          currentDay: stepRequest.day
        });

        res.json({ nextStep, aiResponse });
      } catch (aiError: any) {
        res.status(500).json({ error: 'Failed to generate next step: ' + aiError.message });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Zen Mode routes
  apiRouter.post("/zen/start", requireAuth, async (req: any, res) => {
    try {
      const { duration = 25 } = req.body;
      
      let calendarEventId;
      try {
        const event = await createZenModeEvent(req.user.id, duration);
        calendarEventId = event.id;
      } catch (calendarError) {
        console.warn('Calendar integration unavailable:', calendarError);
      }
      
      const session = await storage.createZenSession({
        userId: req.user.id,
        duration,
        calendarEventId,
        startedAt: new Date()
      });
      
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post("/zen/complete", requireAuth, async (req: any, res) => {
    try {
      const { sessionId } = req.body;
      
      const session = await storage.updateZenSession(sessionId, {
        completed: true,
        completedAt: new Date()
      });
      
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.get("/zen/sessions", requireAuth, async (req: any, res) => {
    try {
      const sessions = await storage.getRecentZenSessions(req.user.id, 10);
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Journal routes
  apiRouter.get("/journal", requireAuth, async (req: any, res) => {
    try {
      const journals = await storage.getJournals(req.user.id);
      res.json(journals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post("/journal", requireAuth, async (req: any, res) => {
    try {
      // Check for crisis language before storing
      const { bodyCipher, title, tags } = req.body;
      
      // Note: In production, you'd decrypt this safely for analysis
      // For now, we'll skip crisis detection on encrypted content
      
      const journal = await storage.createJournal({
        userId: req.user.id,
        title,
        bodyCipher,
        tags: tags || []
      });
      
      res.json(journal);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Contact form route
  apiRouter.post("/contact", async (req: any, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      // Basic validation
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      // In production, this would send an email or store in a database
      // For now, just log the submission
      console.log('Contact form submission:', { name, email, subject, message });
      
      res.json({ 
        success: true, 
        message: 'Your message has been received. We will get back to you soon.' 
      });
    } catch (error: any) {
      console.error('Contact form error:', error);
      res.status(500).json({ error: 'Failed to process contact form' });
    }
  });

  // Calendar integration routes
  apiRouter.get("/calendar/workload", requireAuth, async (req: any, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const workload = await getCalendarWorkload(req.user.id, days);
      res.json(workload);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Insights routes
  apiRouter.get("/insights/correlation", requireAuth, async (req: any, res) => {
    try {
      const days = parseInt(req.query.days as string) || 28;
      const correlation = await storage.getCalendarWorkloadCorrelation(req.user.id, days);
      res.json(correlation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Billing routes
  apiRouter.post("/billing/checkout", requireAuth, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Billing service not configured' });
      }
      
      const { planType } = req.body;
      
      const prices = {
        'STARTER_5': process.env.STRIPE_STARTER_PRICE_ID,
        'PRO_99': process.env.STRIPE_PRO_PRICE_ID
      };
      
      const priceId = prices[planType as keyof typeof prices];
      if (!priceId) {
        return res.status(400).json({ error: 'Invalid plan type' });
      }
      
      const session = await stripe.checkout.sessions.create({
        customer_email: req.user.email,
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/billing`,
        metadata: {
          userId: req.user.id,
          planType
        }
      });
      
      res.json({ sessionUrl: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe webhook handler
  app.post('/api/billing/webhook', async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Billing service not configured' });
    }
    
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody as Buffer,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.log(`Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const { userId, planType } = session.metadata || {};
        
        if (userId && planType) {
          await storage.createSubscription({
            userId,
            planType: planType as any,
            stripeSubscriptionId: session.subscription as string,
            currentPeriodStart: new Date(session.created * 1000),
            currentPeriodEnd: new Date((session.created + 30 * 24 * 60 * 60) * 1000) // 30 days
          });
        }
        break;
      
      case 'invoice.payment_succeeded':
        // Handle successful payment
        break;
      
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        break;
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  // AI Oracle routes
  apiRouter.post("/oracle/ask", requireAuth, async (req: any, res) => {
    try {
      const { question, eiContext } = req.body;
      
      if (!question) {
        return res.status(400).json({ error: 'Question is required' });
      }

      // Build context-aware prompt
      const systemPrompt = `You are an AI mental wellness advisor for entrepreneurs and founders. 
Provide empathetic, actionable advice for mental health, decision-making, and founder challenges.

User's current state: ${eiContext?.state || 'REGULATED'}
EI Score: ${eiContext?.score || 'N/A'}

Focus on:
- Practical mental wellness strategies
- Evidence-based approaches
- Founder-specific challenges
- Work-life balance
- Stress management
- Decision-making frameworks

Keep responses concise (2-3 paragraphs), supportive, and actionable.`;

      // Try Gemini first, fallback to OpenAI, then Anthropic, then provide helpful default
      let answer;
      try {
        answer = await generateOracleResponseGemini(question, systemPrompt);
      } catch (geminiError) {
        console.log('Gemini unavailable, trying OpenAI...', geminiError);
        try {
          answer = await generateOracleResponse(question, systemPrompt);
        } catch (openaiError) {
          console.log('OpenAI unavailable, trying Anthropic...');
          try {
            answer = await generateOracleResponseFallback(question, systemPrompt);
          } catch (anthropicError) {
            console.log('All AI providers unavailable, using default response');
            // Provide a helpful default response when all APIs are unavailable
            answer = `I'm currently experiencing technical difficulties connecting to AI services. However, I can offer some general guidance:

For mental wellness as a founder, consider these evidence-based approaches:
1. **Structured breaks**: Use the Pomodoro technique (25 min work, 5 min break) to maintain focus and prevent burnout.
2. **Journaling**: Regular reflection helps process stress and gain clarity on decisions.
3. **Physical activity**: Even 15 minutes of movement can significantly reduce stress hormones.
4. **Social connection**: Don't isolate - reach out to fellow founders or mentors who understand your journey.

Based on your current state (${eiContext?.state || 'REGULATED'}), ${
  eiContext?.state === 'FREEZE' ? 'focus on small, achievable tasks to build momentum.' :
  eiContext?.state === 'FLIGHT' ? 'prioritize recovery time and stress management techniques.' :
  eiContext?.state === 'FIGHT' ? 'work on decision-making frameworks and strategic clarity.' :
  'keep maintaining your balanced approach.'
}

Please try asking your question again in a few moments when AI services are restored.`;
          }
        }
      }

      res.json({ answer });
    } catch (error: any) {
      console.error('Oracle route error:', error);
      res.status(500).json({ 
        error: 'Unable to process your question at this time. Please try again shortly.' 
      });
    }
  });

  // Media Analysis routes
  apiRouter.get("/media", requireAuth, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const sessions = await storage.getMediaAnalysisSessions(req.user.id, limit);
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post("/media/analyze", requireAuth, async (req: any, res) => {
    try {
      const { mediaType, duration, recordingUrl } = req.body;
      
      if (!mediaType || !duration) {
        return res.status(400).json({ error: 'Media type and duration are required' });
      }

      // Mock AI analysis - In production, this would call OpenAI/Anthropic with actual audio/video processing
      const analysisResult = {
        vocalStressLevel: Math.round(Math.random() * 40 + 30), // 30-70
        emotionalState: ['calm', 'anxious', 'focused', 'overwhelmed', 'energized'][Math.floor(Math.random() * 5)],
        speechPace: ['SLOW', 'NORMAL', 'RAPID'][Math.floor(Math.random() * 3)],
        pauseFrequency: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
        ...(mediaType === 'VIDEO' || mediaType === 'BOTH' ? {
          facialExpression: ['relaxed', 'tense', 'concerned', 'confident'][Math.floor(Math.random() * 4)],
          bodyLanguage: ['open', 'closed', 'restless', 'composed'][Math.floor(Math.random() * 4)],
        } : {}),
        overallWellbeing: Math.round(Math.random() * 30 + 60), // 60-90
        recommendations: [
          'Consider deep breathing exercises to reduce stress levels',
          'Schedule breaks between intense work sessions',
          'Practice mindfulness meditation for 10 minutes daily'
        ],
        rawAnalysis: 'AI-powered analysis of vocal patterns, speech characteristics, and emotional indicators'
      };

      const session = await storage.createMediaAnalysisSession({
        userId: req.user.id,
        mediaType,
        duration,
        recordingUrl: recordingUrl || null,
        analysisResult
      });

      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Wearable device routes
  apiRouter.get("/wearables", requireAuth, async (req: any, res) => {
    try {
      const connections = await storage.getWearableConnections(req.user.id);
      res.json(connections);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post("/wearables/connect", requireAuth, async (req: any, res) => {
    try {
      const { deviceType } = req.body;
      
      if (!deviceType) {
        return res.status(400).json({ error: 'Device type is required' });
      }

      // In production, this would initiate OAuth flow for the device
      // For now, we'll create a simulated connection
      const connection = await storage.createWearableConnection({
        userId: req.user.id,
        deviceType,
        deviceName: deviceType.replace('_', ' '),
        accessToken: 'simulated_token_' + Date.now(),
        refreshToken: null,
        tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
        lastSyncAt: new Date()
      });

      res.json(connection);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.delete("/wearables/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteWearableConnection(req.params.id, req.user.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Privacy & data management routes
  apiRouter.post("/privacy/export", requireAuth, async (req: any, res) => {
    try {
      const analytics = await storage.getUserAnalytics(req.user.id);
      
      // Remove sensitive data and prepare for export
      const exportData = {
        user: analytics.profile,
        effectivenessData: analytics.eiTrend,
        programs: analytics.activePrograms,
        zenSessions: analytics.zenActivity,
        exportedAt: new Date().toISOString()
      };
      
      res.json(exportData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mount API router
  app.use('/api', apiRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
