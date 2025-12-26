// Firestore Storage Implementation
// Replaces PostgreSQL/Drizzle storage with Firebase Firestore

import { adminDb, FieldValue, Timestamp } from "./lib/firebase-admin";
import { 
  type User, type InsertUser, type Profile, type InsertProfile,
  type Journal, type InsertJournal, type EISnapshot, type InsertEISnapshot,
  type ProgramAssignment, type InsertProgramAssignment, type CalendarCred,
  type Subscription, type ZenSession, type InsertZenSession, type ProgramStep,
  type MediaAnalysisSession, type InsertMediaAnalysisSession,
  type WearableConnection, type InsertWearableConnection,
  type PasswordResetToken, type InsertPasswordResetToken
} from "@shared/schema";
import { IStorage } from "./storage";

// Helper to generate UUIDs
function generateId(): string {
  return crypto.randomUUID();
}

// Helper to convert Firestore Timestamp to Date
function timestampToDate(timestamp: any): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return new Date();
}

// Helper to convert Firestore document to typed object
function docToObject<T>(doc: FirebaseFirestore.DocumentSnapshot): T | undefined {
  if (!doc.exists) return undefined;
  const data = doc.data();
  if (!data) return undefined;
  
  // Convert timestamps to dates
  const result: any = { id: doc.id };
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate();
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

// Collection references
const collections = {
  users: 'users',
  profiles: 'profiles',
  journals: 'journals',
  eiSnapshots: 'eiSnapshots',
  programAssignments: 'programAssignments',
  programSteps: 'programSteps',
  calendarCreds: 'calendarCreds',
  subscriptions: 'subscriptions',
  zenSessions: 'zenSessions',
  mediaAnalysisSessions: 'mediaAnalysisSessions',
  wearableConnections: 'wearableConnections',
  passwordResetTokens: 'passwordResetTokens'
};

export class FirestoreStorage implements IStorage {
  
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const doc = await adminDb.collection(collections.users).doc(id).get();
    return docToObject<User>(doc);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const snapshot = await adminDb.collection(collections.users)
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (snapshot.empty) return undefined;
    return docToObject<User>(snapshot.docs[0]);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = generateId();
    const now = new Date();
    const userData = {
      ...insertUser,
      createdAt: now,
      updatedAt: now
    };
    
    await adminDb.collection(collections.users).doc(id).set(userData);
    return { id, ...userData } as User;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const updateData = { ...updates, updatedAt: new Date() };
    delete (updateData as any).id;
    
    await adminDb.collection(collections.users).doc(id).update(updateData);
    
    const doc = await adminDb.collection(collections.users).doc(id).get();
    return docToObject<User>(doc)!;
  }

  // Profile management
  async getProfile(userId: string): Promise<Profile | undefined> {
    const snapshot = await adminDb.collection(collections.profiles)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (snapshot.empty) return undefined;
    return docToObject<Profile>(snapshot.docs[0]);
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const id = generateId();
    const now = new Date();
    const profileData = {
      ...insertProfile,
      createdAt: now,
      updatedAt: now
    };
    
    await adminDb.collection(collections.profiles).doc(id).set(profileData);
    return { id, ...profileData } as Profile;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const snapshot = await adminDb.collection(collections.profiles)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      throw new Error('Profile not found');
    }
    
    const docRef = snapshot.docs[0].ref;
    const updateData = { ...updates, updatedAt: new Date() };
    delete (updateData as any).id;
    
    await docRef.update(updateData);
    
    const updatedDoc = await docRef.get();
    return docToObject<Profile>(updatedDoc)!;
  }

  // Journal management
  async getJournals(userId: string, limit: number = 50): Promise<Journal[]> {
    const snapshot = await adminDb.collection(collections.journals)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => docToObject<Journal>(doc)!);
  }

  async getJournal(id: string): Promise<Journal | undefined> {
    const doc = await adminDb.collection(collections.journals).doc(id).get();
    return docToObject<Journal>(doc);
  }

  async createJournal(insertJournal: InsertJournal): Promise<Journal> {
    const id = generateId();
    const now = new Date();
    const journalData = {
      ...insertJournal,
      createdAt: now,
      updatedAt: now
    };
    
    await adminDb.collection(collections.journals).doc(id).set(journalData);
    return { id, ...journalData } as Journal;
  }

  async updateJournal(id: string, updates: Partial<Journal>): Promise<Journal> {
    const updateData = { ...updates, updatedAt: new Date() };
    delete (updateData as any).id;
    
    await adminDb.collection(collections.journals).doc(id).update(updateData);
    
    const doc = await adminDb.collection(collections.journals).doc(id).get();
    return docToObject<Journal>(doc)!;
  }

  async deleteJournal(id: string): Promise<void> {
    await adminDb.collection(collections.journals).doc(id).delete();
  }

  // EI Snapshots
  async getLatestEISnapshot(userId: string): Promise<EISnapshot | undefined> {
    const snapshot = await adminDb.collection(collections.eiSnapshots)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) return undefined;
    return docToObject<EISnapshot>(snapshot.docs[0]);
  }

  async getEISnapshots(userId: string, days: number = 28): Promise<EISnapshot[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const snapshot = await adminDb.collection(collections.eiSnapshots)
      .where('userId', '==', userId)
      .where('createdAt', '>=', cutoffDate)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => docToObject<EISnapshot>(doc)!);
  }

  async createEISnapshot(insertSnapshot: InsertEISnapshot): Promise<EISnapshot> {
    const id = generateId();
    const now = new Date();
    const snapshotData = {
      ...insertSnapshot,
      createdAt: now
    };
    
    await adminDb.collection(collections.eiSnapshots).doc(id).set(snapshotData);
    return { id, ...snapshotData } as EISnapshot;
  }

  // Program management
  async getUserPrograms(userId: string, status?: string): Promise<ProgramAssignment[]> {
    let query = adminDb.collection(collections.programAssignments)
      .where('userId', '==', userId);
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => docToObject<ProgramAssignment>(doc)!);
  }

  async getProgramAssignment(id: string): Promise<ProgramAssignment | undefined> {
    const doc = await adminDb.collection(collections.programAssignments).doc(id).get();
    return docToObject<ProgramAssignment>(doc);
  }

  async createProgramAssignment(insertAssignment: InsertProgramAssignment): Promise<ProgramAssignment> {
    const id = generateId();
    const now = new Date();
    const assignmentData = {
      ...insertAssignment,
      createdAt: now,
      updatedAt: now
    };
    
    await adminDb.collection(collections.programAssignments).doc(id).set(assignmentData);
    return { id, ...assignmentData } as ProgramAssignment;
  }

  async updateProgramAssignment(id: string, updates: Partial<ProgramAssignment>): Promise<ProgramAssignment> {
    const updateData = { ...updates, updatedAt: new Date() };
    delete (updateData as any).id;
    
    await adminDb.collection(collections.programAssignments).doc(id).update(updateData);
    
    const doc = await adminDb.collection(collections.programAssignments).doc(id).get();
    return docToObject<ProgramAssignment>(doc)!;
  }

  // Program steps
  async getProgramSteps(assignmentId: string): Promise<ProgramStep[]> {
    const snapshot = await adminDb.collection(collections.programSteps)
      .where('assignmentId', '==', assignmentId)
      .orderBy('day')
      .get();
    
    return snapshot.docs.map(doc => docToObject<ProgramStep>(doc)!);
  }

  async getCurrentProgramStep(assignmentId: string): Promise<ProgramStep | undefined> {
    const snapshot = await adminDb.collection(collections.programSteps)
      .where('assignmentId', '==', assignmentId)
      .where('completed', '==', false)
      .orderBy('day')
      .limit(1)
      .get();
    
    if (snapshot.empty) return undefined;
    return docToObject<ProgramStep>(snapshot.docs[0]);
  }

  async createProgramStep(step: Omit<ProgramStep, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProgramStep> {
    const id = generateId();
    const now = new Date();
    const stepData = {
      ...step,
      createdAt: now,
      updatedAt: now
    };
    
    await adminDb.collection(collections.programSteps).doc(id).set(stepData);
    return { id, ...stepData } as ProgramStep;
  }

  async completeProgramStep(stepId: string): Promise<ProgramStep> {
    const now = new Date();
    await adminDb.collection(collections.programSteps).doc(stepId).update({
      completed: true,
      completedAt: now,
      updatedAt: now
    });
    
    const doc = await adminDb.collection(collections.programSteps).doc(stepId).get();
    return docToObject<ProgramStep>(doc)!;
  }

  // Calendar credentials
  async getCalendarCred(userId: string): Promise<CalendarCred | undefined> {
    const snapshot = await adminDb.collection(collections.calendarCreds)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (snapshot.empty) return undefined;
    return docToObject<CalendarCred>(snapshot.docs[0]);
  }

  async upsertCalendarCred(cred: CalendarCred): Promise<CalendarCred> {
    const snapshot = await adminDb.collection(collections.calendarCreds)
      .where('userId', '==', cred.userId)
      .limit(1)
      .get();
    
    const now = new Date();
    
    if (snapshot.empty) {
      const id = generateId();
      const credData = { ...cred, createdAt: now, updatedAt: now };
      await adminDb.collection(collections.calendarCreds).doc(id).set(credData);
      return { id, ...credData } as CalendarCred;
    } else {
      const docRef = snapshot.docs[0].ref;
      const updateData = { ...cred, updatedAt: now };
      delete (updateData as any).id;
      await docRef.update(updateData);
      const updatedDoc = await docRef.get();
      return docToObject<CalendarCred>(updatedDoc)!;
    }
  }

  // Subscriptions
  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const snapshot = await adminDb.collection(collections.subscriptions)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) return undefined;
    return docToObject<Subscription>(snapshot.docs[0]);
  }

  async createSubscription(insertSubscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    const id = generateId();
    const now = new Date();
    const subscriptionData = {
      ...insertSubscription,
      createdAt: now,
      updatedAt: now
    };
    
    await adminDb.collection(collections.subscriptions).doc(id).set(subscriptionData);
    return { id, ...subscriptionData } as Subscription;
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const updateData = { ...updates, updatedAt: new Date() };
    delete (updateData as any).id;
    
    await adminDb.collection(collections.subscriptions).doc(id).update(updateData);
    
    const doc = await adminDb.collection(collections.subscriptions).doc(id).get();
    return docToObject<Subscription>(doc)!;
  }

  // Zen sessions
  async getRecentZenSessions(userId: string, limit: number = 10): Promise<ZenSession[]> {
    const snapshot = await adminDb.collection(collections.zenSessions)
      .where('userId', '==', userId)
      .orderBy('startedAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => docToObject<ZenSession>(doc)!);
  }

  async createZenSession(insertSession: InsertZenSession): Promise<ZenSession> {
    const id = generateId();
    const sessionData = {
      ...insertSession,
      createdAt: new Date()
    };
    
    await adminDb.collection(collections.zenSessions).doc(id).set(sessionData);
    return { id, ...sessionData } as ZenSession;
  }

  async updateZenSession(id: string, updates: Partial<ZenSession>): Promise<ZenSession> {
    const updateData = { ...updates };
    delete (updateData as any).id;
    
    await adminDb.collection(collections.zenSessions).doc(id).update(updateData);
    
    const doc = await adminDb.collection(collections.zenSessions).doc(id).get();
    return docToObject<ZenSession>(doc)!;
  }

  // Media analysis sessions
  async getMediaAnalysisSessions(userId: string, limit: number = 10): Promise<MediaAnalysisSession[]> {
    const snapshot = await adminDb.collection(collections.mediaAnalysisSessions)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => docToObject<MediaAnalysisSession>(doc)!);
  }

  async createMediaAnalysisSession(insertSession: InsertMediaAnalysisSession): Promise<MediaAnalysisSession> {
    const id = generateId();
    const now = new Date();
    const sessionData = {
      ...insertSession,
      createdAt: now
    };
    
    await adminDb.collection(collections.mediaAnalysisSessions).doc(id).set(sessionData);
    return { id, ...sessionData } as MediaAnalysisSession;
  }

  // Wearable connections
  async getWearableConnections(userId: string): Promise<WearableConnection[]> {
    const snapshot = await adminDb.collection(collections.wearableConnections)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => docToObject<WearableConnection>(doc)!);
  }

  async createWearableConnection(insertConnection: InsertWearableConnection): Promise<WearableConnection> {
    const id = generateId();
    const now = new Date();
    const connectionData = {
      ...insertConnection,
      createdAt: now
    };
    
    await adminDb.collection(collections.wearableConnections).doc(id).set(connectionData);
    return { id, ...connectionData } as WearableConnection;
  }

  async deleteWearableConnection(id: string, userId: string): Promise<void> {
    const doc = await adminDb.collection(collections.wearableConnections).doc(id).get();
    const data = doc.data();
    
    if (data && data.userId === userId) {
      await adminDb.collection(collections.wearableConnections).doc(id).delete();
    }
  }

  // Password reset tokens
  async createPasswordResetToken(insertToken: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const id = generateId();
    const now = new Date();
    const tokenData = {
      ...insertToken,
      createdAt: now
    };
    
    await adminDb.collection(collections.passwordResetTokens).doc(id).set(tokenData);
    return { id, ...tokenData } as PasswordResetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const snapshot = await adminDb.collection(collections.passwordResetTokens)
      .where('token', '==', token)
      .limit(1)
      .get();
    
    if (snapshot.empty) return undefined;
    return docToObject<PasswordResetToken>(snapshot.docs[0]);
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    const snapshot = await adminDb.collection(collections.passwordResetTokens)
      .where('token', '==', token)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({ used: true });
    }
  }

  // Analytics & insights
  async getCalendarWorkloadCorrelation(userId: string, days: number = 28): Promise<any> {
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
    const zenSessionsList = await this.getRecentZenSessions(userId, 30);
    
    return {
      profile,
      currentEI: latestEI,
      eiTrend: eiHistory,
      activePrograms: programs,
      zenActivity: {
        totalSessions: zenSessionsList.length,
        completedSessions: zenSessionsList.filter(s => s.completed).length,
        totalMinutes: zenSessionsList.reduce((sum, s) => sum + s.duration, 0)
      },
      insights: await this.getCalendarWorkloadCorrelation(userId)
    };
  }
}

// Export Firestore storage instance
export const firestoreStorage = new FirestoreStorage();
