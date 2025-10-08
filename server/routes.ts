import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { z } from "zod";
import { storage } from "./storage";
import { insertProfileSchema, insertJournalSchema } from "@shared/schema";
import { generateProgramStep } from "./openai";
import { generateProgramStepFallback, detectCrisisLanguage } from "./anthropic";
import { createZenModeEvent, getCalendarWorkload, setupCalendarWatch } from "./googleCalendarClient";

// Stripe setup
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

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
  
  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    // Placeholder - would implement proper NextAuth integration
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Mock user for development
    req.user = { 
      id: 'user-1', 
      email: 'founder@example.com', 
      name: 'John Doe',
      role: 'FOUNDER'
    };
    next();
  };

  // User profile routes
  app.get("/api/me", requireAuth, async (req: any, res) => {
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

  app.put("/api/profile", requireAuth, async (req: any, res) => {
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
  app.post("/api/onboarding/complete", requireAuth, async (req: any, res) => {
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
  app.post("/api/diagnostic/submit", requireAuth, async (req: any, res) => {
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

  app.get("/api/ei/latest", requireAuth, async (req: any, res) => {
    try {
      const snapshot = await storage.getLatestEISnapshot(req.user.id);
      res.json(snapshot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ei/trend", requireAuth, async (req: any, res) => {
    try {
      const days = parseInt(req.query.window as string) || 28;
      const snapshots = await storage.getEISnapshots(req.user.id, days);
      res.json(snapshots);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Program management routes
  app.get("/api/programs", requireAuth, async (req: any, res) => {
    try {
      const programs = await storage.getUserPrograms(req.user.id);
      res.json(programs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/programs/assign", requireAuth, async (req: any, res) => {
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

  app.post("/api/programs/step/complete", requireAuth, async (req: any, res) => {
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
          aiResponse = await generateProgramStepFallback(stepRequest);
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
  app.post("/api/zen/start", requireAuth, async (req: any, res) => {
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

  app.post("/api/zen/complete", requireAuth, async (req: any, res) => {
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

  // Journal routes
  app.get("/api/journal", requireAuth, async (req: any, res) => {
    try {
      const journals = await storage.getJournals(req.user.id);
      res.json(journals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/journal", requireAuth, async (req: any, res) => {
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

  // Calendar integration routes
  app.get("/api/calendar/workload", requireAuth, async (req: any, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const workload = await getCalendarWorkload(req.user.id, days);
      res.json(workload);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Insights routes
  app.get("/api/insights/correlation", requireAuth, async (req: any, res) => {
    try {
      const days = parseInt(req.query.days as string) || 28;
      const correlation = await storage.getCalendarWorkloadCorrelation(req.user.id, days);
      res.json(correlation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Billing routes
  app.post("/api/billing/checkout", requireAuth, async (req: any, res) => {
    try {
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

  // Privacy & data management routes
  app.post("/api/privacy/export", requireAuth, async (req: any, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
