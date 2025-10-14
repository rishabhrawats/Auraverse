import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean, real, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['FOUNDER', 'THERAPIST', 'ADMIN']);
export const ventureStageEnum = pgEnum('venture_stage', ['IDEA', 'PRESEED', 'SEED', 'SERIES_A', 'GROWTH', 'PRE_IPO', 'IPO']);
export const avatarTypeEnum = pgEnum('avatar_type', ['VISIONARY', 'OPERATOR', 'RAINMAKER', 'CRAFTSMAN', 'GUARDIAN', 'EXPLORER', 'STABILIZER', 'CATALYST']);
export const regStateEnum = pgEnum('reg_state', ['FIGHT', 'FLIGHT', 'FREEZE', 'REGULATED']);
export const programStatusEnum = pgEnum('program_status', ['ACTIVE', 'PAUSED', 'DONE']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['ACTIVE', 'CANCELED', 'INCOMPLETE', 'PAST_DUE']);
export const planTypeEnum = pgEnum('plan_type', ['BASIC_5', 'MEDIUM_29', 'EXCLUSIVE_99']);

// Core tables
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // Optional for OAuth users
  name: text("name"),
  role: userRoleEnum("role").default('FOUNDER'),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const profiles = pgTable("profiles", {
  userId: varchar("user_id").primaryKey(),
  ventureStage: ventureStageEnum("venture_stage").notNull(),
  primaryStressors: jsonb("primary_stressors").$type<string[]>().notNull(),
  avatarArchetype: avatarTypeEnum("avatar_archetype").notNull(),
  sleepHours: real("sleep_hours"),
  workloadHrsWk: integer("workload_hrs_wk"),
  timezone: text("timezone").notNull(),
  consentAt: timestamp("consent_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const journals = pgTable("journals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title"),
  bodyCipher: text("body_cipher").notNull(), // Base64 encoded encrypted data
  tags: jsonb("tags").$type<string[]>().default([]),
  summary: text("summary"), // AI summary stored with explicit consent
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const eiSnapshots = pgTable("ei_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  score: integer("score").notNull(), // 0-100
  // Sub-indices (all 0-100)
  focusEfficiency: integer("focus_efficiency").notNull(),
  recoveryLatency: integer("recovery_latency").notNull(),
  decisionClarity: integer("decision_clarity").notNull(),
  emotionRegulation: integer("emotion_regulation").notNull(),
  supportUtilization: integer("support_utilization").notNull(),
  strategicMomentum: integer("strategic_momentum").notNull(),
  state: regStateEnum("state").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const programAssignments = pgTable("program_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  programCode: text("program_code").notNull(), // "FOUNDERS-FOCUS-7D", etc.
  currentDay: integer("current_day").default(1),
  totalDays: integer("total_days").notNull(),
  startAt: timestamp("start_at").notNull(),
  completedAt: timestamp("completed_at"),
  status: programStatusEnum("status").default('ACTIVE'),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const calendarCreds = pgTable("calendar_creds", {
  userId: varchar("user_id").primaryKey(),
  provider: text("provider").default('google'),
  refreshToken: text("refresh_token").notNull(),
  accessToken: text("access_token").notNull(),
  expiryAt: timestamp("expiry_at").notNull(),
  watchChannelId: text("watch_channel_id"),
  watchResourceId: text("watch_resource_id"),
  watchExpiration: timestamp("watch_expiration"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  provider: text("provider").default('STRIPE'),
  planType: planTypeEnum("plan_type").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: subscriptionStatusEnum("status").default('ACTIVE'),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAt: timestamp("cancel_at"),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const zenSessions = pgTable("zen_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  duration: integer("duration").notNull(), // in minutes
  completed: boolean("completed").default(false),
  calendarEventId: text("calendar_event_id"),
  breathingPattern: text("breathing_pattern").default('4-7-8'),
  ambientSound: text("ambient_sound"),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const programSteps = pgTable("program_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull(),
  day: integer("day").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  aiResponse: text("ai_response"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const mediaAnalysisSessions = pgTable("media_analysis_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  mediaType: text("media_type").notNull(), // 'VOICE', 'VIDEO', 'BOTH'
  duration: integer("duration").notNull(), // in seconds
  analysisResult: jsonb("analysis_result").$type<{
    vocalStressLevel?: number; // 0-100
    emotionalState?: string; // detected emotion
    speechPace?: string; // 'SLOW', 'NORMAL', 'RAPID'
    pauseFrequency?: string; // 'LOW', 'MEDIUM', 'HIGH'
    facialExpression?: string; // if video
    bodyLanguage?: string; // if video
    overallWellbeing?: number; // 0-100
    recommendations?: string[];
    rawAnalysis?: string;
  }>().default({}),
  recordingUrl: text("recording_url"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const wearableConnections = pgTable("wearable_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  deviceType: text("device_type").notNull(), // 'APPLE_WATCH', 'FITBIT', 'OURA', 'SAMSUNG', 'AMAZFIT', 'XIAOMI'
  deviceName: text("device_name"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const wearableData = pgTable("wearable_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull(),
  userId: varchar("user_id").notNull(),
  dataType: text("data_type").notNull(), // 'HEART_RATE', 'SLEEP', 'ACTIVITY', 'HRV', 'STEPS', 'CALORIES'
  value: real("value").notNull(),
  unit: text("unit"), // 'bpm', 'hours', 'steps', 'kcal', 'ms'
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  recordedAt: timestamp("recorded_at").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  journals: many(journals),
  eiSnapshots: many(eiSnapshots),
  programAssignments: many(programAssignments),
  calendarCred: one(calendarCreds, {
    fields: [users.id],
    references: [calendarCreds.userId],
  }),
  subscriptions: many(subscriptions),
  zenSessions: many(zenSessions),
  mediaAnalysisSessions: many(mediaAnalysisSessions),
  wearableConnections: many(wearableConnections),
  wearableData: many(wearableData),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const journalsRelations = relations(journals, ({ one }) => ({
  user: one(users, {
    fields: [journals.userId],
    references: [users.id],
  }),
}));

export const eiSnapshotsRelations = relations(eiSnapshots, ({ one }) => ({
  user: one(users, {
    fields: [eiSnapshots.userId],
    references: [users.id],
  }),
}));

export const programAssignmentsRelations = relations(programAssignments, ({ one, many }) => ({
  user: one(users, {
    fields: [programAssignments.userId],
    references: [users.id],
  }),
  steps: many(programSteps),
}));

export const programStepsRelations = relations(programSteps, ({ one }) => ({
  assignment: one(programAssignments, {
    fields: [programSteps.assignmentId],
    references: [programAssignments.id],
  }),
}));

export const calendarCredsRelations = relations(calendarCreds, ({ one }) => ({
  user: one(users, {
    fields: [calendarCreds.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const zenSessionsRelations = relations(zenSessions, ({ one }) => ({
  user: one(users, {
    fields: [zenSessions.userId],
    references: [users.id],
  }),
}));

export const mediaAnalysisSessionsRelations = relations(mediaAnalysisSessions, ({ one }) => ({
  user: one(users, {
    fields: [mediaAnalysisSessions.userId],
    references: [users.id],
  }),
}));

export const wearableConnectionsRelations = relations(wearableConnections, ({ one, many }) => ({
  user: one(users, {
    fields: [wearableConnections.userId],
    references: [users.id],
  }),
  data: many(wearableData),
}));

export const wearableDataRelations = relations(wearableData, ({ one }) => ({
  user: one(users, {
    fields: [wearableData.userId],
    references: [users.id],
  }),
  connection: one(wearableConnections, {
    fields: [wearableData.connectionId],
    references: [wearableConnections.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertJournalSchema = createInsertSchema(journals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEISnapshotSchema = createInsertSchema(eiSnapshots).omit({
  id: true,
  createdAt: true,
});

export const insertProgramAssignmentSchema = createInsertSchema(programAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertZenSessionSchema = createInsertSchema(zenSessions).omit({
  id: true,
  createdAt: true,
});

export const insertMediaAnalysisSessionSchema = createInsertSchema(mediaAnalysisSessions).omit({
  id: true,
  createdAt: true,
});

export const insertWearableConnectionSchema = createInsertSchema(wearableConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWearableDataSchema = createInsertSchema(wearableData).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Journal = typeof journals.$inferSelect;
export type InsertJournal = z.infer<typeof insertJournalSchema>;
export type EISnapshot = typeof eiSnapshots.$inferSelect;
export type InsertEISnapshot = z.infer<typeof insertEISnapshotSchema>;
export type ProgramAssignment = typeof programAssignments.$inferSelect;
export type InsertProgramAssignment = z.infer<typeof insertProgramAssignmentSchema>;
export type CalendarCred = typeof calendarCreds.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type ZenSession = typeof zenSessions.$inferSelect;
export type InsertZenSession = z.infer<typeof insertZenSessionSchema>;
export type ProgramStep = typeof programSteps.$inferSelect;
export type MediaAnalysisSession = typeof mediaAnalysisSessions.$inferSelect;
export type InsertMediaAnalysisSession = z.infer<typeof insertMediaAnalysisSessionSchema>;
export type WearableConnection = typeof wearableConnections.$inferSelect;
export type InsertWearableConnection = z.infer<typeof insertWearableConnectionSchema>;
export type WearableData = typeof wearableData.$inferSelect;
export type InsertWearableData = z.infer<typeof insertWearableDataSchema>;
