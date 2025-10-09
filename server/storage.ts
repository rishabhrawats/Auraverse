import { 
  users, profiles, journals, eiSnapshots, programAssignments, 
  calendarCreds, subscriptions, zenSessions, programSteps, mediaAnalysisSessions,
  type User, type InsertUser, type Profile, type InsertProfile,
  type Journal, type InsertJournal, type EISnapshot, type InsertEISnapshot,
  type ProgramAssignment, type InsertProgramAssignment, type CalendarCred,
  type Subscription, type ZenSession, type InsertZenSession, type ProgramStep,
  type MediaAnalysisSession, type InsertMediaAnalysisSession
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Profile management
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile>;
  
  // Journal management
  getJournals(userId: string, limit?: number): Promise<Journal[]>;
  getJournal(id: string): Promise<Journal | undefined>;
  createJournal(journal: InsertJournal): Promise<Journal>;
  updateJournal(id: string, updates: Partial<Journal>): Promise<Journal>;
  deleteJournal(id: string): Promise<void>;
  
  // EI Snapshots
  getLatestEISnapshot(userId: string): Promise<EISnapshot | undefined>;
  getEISnapshots(userId: string, days?: number): Promise<EISnapshot[]>;
  createEISnapshot(snapshot: InsertEISnapshot): Promise<EISnapshot>;
  
  // Program management
  getUserPrograms(userId: string, status?: string): Promise<ProgramAssignment[]>;
  getProgramAssignment(id: string): Promise<ProgramAssignment | undefined>;
  createProgramAssignment(assignment: InsertProgramAssignment): Promise<ProgramAssignment>;
  updateProgramAssignment(id: string, updates: Partial<ProgramAssignment>): Promise<ProgramAssignment>;
  
  // Program steps
  getProgramSteps(assignmentId: string): Promise<ProgramStep[]>;
  getCurrentProgramStep(assignmentId: string): Promise<ProgramStep | undefined>;
  createProgramStep(step: Omit<ProgramStep, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProgramStep>;
  completeProgramStep(stepId: string): Promise<ProgramStep>;
  
  // Calendar credentials
  getCalendarCred(userId: string): Promise<CalendarCred | undefined>;
  upsertCalendarCred(cred: CalendarCred): Promise<CalendarCred>;
  
  // Subscriptions
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription>;
  
  // Zen sessions
  getRecentZenSessions(userId: string, limit?: number): Promise<ZenSession[]>;
  createZenSession(session: InsertZenSession): Promise<ZenSession>;
  updateZenSession(id: string, updates: Partial<ZenSession>): Promise<ZenSession>;
  
  // Media analysis sessions
  getMediaAnalysisSessions(userId: string, limit?: number): Promise<MediaAnalysisSession[]>;
  createMediaAnalysisSession(session: InsertMediaAnalysisSession): Promise<MediaAnalysisSession>;
  
  // Analytics & insights
  getCalendarWorkloadCorrelation(userId: string, days?: number): Promise<any>;
  getUserAnalytics(userId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Profile management
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    return profile;
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const [profile] = await db.insert(profiles).values(insertProfile).returning();
    return profile;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const [profile] = await db.update(profiles)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(eq(profiles.userId, userId))
      .returning();
    return profile;
  }

  // Journal management
  async getJournals(userId: string, limit: number = 50): Promise<Journal[]> {
    return await db.select()
      .from(journals)
      .where(eq(journals.userId, userId))
      .orderBy(desc(journals.createdAt))
      .limit(limit);
  }

  async getJournal(id: string): Promise<Journal | undefined> {
    const [journal] = await db.select().from(journals).where(eq(journals.id, id)).limit(1);
    return journal;
  }

  async createJournal(insertJournal: InsertJournal): Promise<Journal> {
    const [journal] = await db.insert(journals).values(insertJournal).returning();
    return journal;
  }

  async updateJournal(id: string, updates: Partial<Journal>): Promise<Journal> {
    const [journal] = await db.update(journals)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(eq(journals.id, id))
      .returning();
    return journal;
  }

  async deleteJournal(id: string): Promise<void> {
    await db.delete(journals).where(eq(journals.id, id));
  }

  // EI Snapshots
  async getLatestEISnapshot(userId: string): Promise<EISnapshot | undefined> {
    const [snapshot] = await db.select()
      .from(eiSnapshots)
      .where(eq(eiSnapshots.userId, userId))
      .orderBy(desc(eiSnapshots.createdAt))
      .limit(1);
    return snapshot;
  }

  async getEISnapshots(userId: string, days: number = 28): Promise<EISnapshot[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await db.select()
      .from(eiSnapshots)
      .where(and(
        eq(eiSnapshots.userId, userId),
        gte(eiSnapshots.createdAt, cutoffDate)
      ))
      .orderBy(desc(eiSnapshots.createdAt));
  }

  async createEISnapshot(insertSnapshot: InsertEISnapshot): Promise<EISnapshot> {
    const [snapshot] = await db.insert(eiSnapshots).values(insertSnapshot).returning();
    return snapshot;
  }

  // Program management
  async getUserPrograms(userId: string, status?: string): Promise<ProgramAssignment[]> {
    const conditions = [eq(programAssignments.userId, userId)];
    if (status) {
      conditions.push(eq(programAssignments.status, status as any));
    }
    
    return await db.select()
      .from(programAssignments)
      .where(and(...conditions))
      .orderBy(desc(programAssignments.createdAt));
  }

  async getProgramAssignment(id: string): Promise<ProgramAssignment | undefined> {
    const [assignment] = await db.select()
      .from(programAssignments)
      .where(eq(programAssignments.id, id))
      .limit(1);
    return assignment;
  }

  async createProgramAssignment(insertAssignment: InsertProgramAssignment): Promise<ProgramAssignment> {
    const [assignment] = await db.insert(programAssignments).values(insertAssignment).returning();
    return assignment;
  }

  async updateProgramAssignment(id: string, updates: Partial<ProgramAssignment>): Promise<ProgramAssignment> {
    const [assignment] = await db.update(programAssignments)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(eq(programAssignments.id, id))
      .returning();
    return assignment;
  }

  // Program steps
  async getProgramSteps(assignmentId: string): Promise<ProgramStep[]> {
    return await db.select()
      .from(programSteps)
      .where(eq(programSteps.assignmentId, assignmentId))
      .orderBy(programSteps.day);
  }

  async getCurrentProgramStep(assignmentId: string): Promise<ProgramStep | undefined> {
    const [step] = await db.select()
      .from(programSteps)
      .where(and(
        eq(programSteps.assignmentId, assignmentId),
        eq(programSteps.completed, false)
      ))
      .orderBy(programSteps.day)
      .limit(1);
    return step;
  }

  async createProgramStep(step: Omit<ProgramStep, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProgramStep> {
    const [createdStep] = await db.insert(programSteps).values(step).returning();
    return createdStep;
  }

  async completeProgramStep(stepId: string): Promise<ProgramStep> {
    const [step] = await db.update(programSteps)
      .set({ 
        completed: true, 
        completedAt: sql`now()`,
        updatedAt: sql`now()` 
      })
      .where(eq(programSteps.id, stepId))
      .returning();
    return step;
  }

  // Calendar credentials
  async getCalendarCred(userId: string): Promise<CalendarCred | undefined> {
    const [cred] = await db.select()
      .from(calendarCreds)
      .where(eq(calendarCreds.userId, userId))
      .limit(1);
    return cred;
  }

  async upsertCalendarCred(cred: CalendarCred): Promise<CalendarCred> {
    const [upsertedCred] = await db.insert(calendarCreds)
      .values(cred)
      .onConflictDoUpdate({
        target: calendarCreds.userId,
        set: {
          ...cred,
          updatedAt: sql`now()`
        }
      })
      .returning();
    return upsertedCred;
  }

  // Subscriptions
  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return subscription;
  }

  async createSubscription(insertSubscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions).values(insertSubscription).returning();
    return subscription;
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const [subscription] = await db.update(subscriptions)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  // Zen sessions
  async getRecentZenSessions(userId: string, limit: number = 10): Promise<ZenSession[]> {
    return await db.select()
      .from(zenSessions)
      .where(eq(zenSessions.userId, userId))
      .orderBy(desc(zenSessions.startedAt))
      .limit(limit);
  }

  async createZenSession(insertSession: InsertZenSession): Promise<ZenSession> {
    const [session] = await db.insert(zenSessions).values(insertSession).returning();
    return session;
  }

  async updateZenSession(id: string, updates: Partial<ZenSession>): Promise<ZenSession> {
    const [session] = await db.update(zenSessions)
      .set(updates)
      .where(eq(zenSessions.id, id))
      .returning();
    return session;
  }

  // Analytics & insights
  async getCalendarWorkloadCorrelation(userId: string, days: number = 28): Promise<any> {
    // This would implement complex correlation analysis between EI scores and calendar data
    // For now, return placeholder structure
    const eiData = await this.getEISnapshots(userId, days);
    
    return {
      correlations: {
        eiVsMeetingDensity: -0.62,
        recoveryLatencyVsEveningEvents: 0.45,
        focusEfficiencyVsPeakBlocks: -0.38
      },
      insights: [
        { type: 'negative', metric: 'Meeting Density', correlation: -0.62, description: 'Higher meeting load correlates with lower effectiveness scores' },
        { type: 'positive', metric: 'Evening Events', correlation: 0.45, description: 'Evening commitments increase time to regulate' },
        { type: 'negative', metric: 'Peak Blocks', correlation: -0.38, description: 'Long continuous meetings reduce focus efficiency' }
      ],
      dataPoints: eiData.length
    };
  }

  async getUserAnalytics(userId: string): Promise<any> {
    const profile = await this.getProfile(userId);
    const latestEI = await this.getLatestEISnapshot(userId);
    const eiHistory = await this.getEISnapshots(userId, 28);
    const programs = await this.getUserPrograms(userId, 'ACTIVE');
    const zenSessions = await this.getRecentZenSessions(userId, 30);
    
    return {
      profile,
      currentEI: latestEI,
      eiTrend: eiHistory,
      activePrograms: programs,
      zenActivity: {
        totalSessions: zenSessions.length,
        completedSessions: zenSessions.filter(s => s.completed).length,
        totalMinutes: zenSessions.reduce((sum, s) => sum + s.duration, 0)
      },
      insights: await this.getCalendarWorkloadCorrelation(userId)
    };
  }
}

export const storage = new DatabaseStorage();
