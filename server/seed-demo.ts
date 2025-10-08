import { db } from './db';
import { users, profiles, journals, eiSnapshots, programAssignments, programSteps, zenSessions, subscriptions } from '@shared/schema';
import bcrypt from 'bcrypt';
import { sql } from 'drizzle-orm';

// Demo credentials
const DEMO_EMAIL = 'demo@auraverse.ai';
const DEMO_PASSWORD = 'demo2025';
const DEMO_NAME = 'Alex Rivera';

async function seedDemo() {
  console.log('🌱 Seeding demo account...');

  // 1. Create demo user
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  
  const [demoUser] = await db.insert(users).values({
    email: DEMO_EMAIL,
    passwordHash,
    name: DEMO_NAME,
    role: 'FOUNDER',
  }).returning();

  console.log('✅ Created demo user:', DEMO_EMAIL);

  // 2. Create comprehensive profile
  await db.insert(profiles).values({
    userId: demoUser.id,
    ventureStage: 'SEED',
    primaryStressors: ['Fundraising pressure', 'Team scaling', 'Product-market fit', 'Work-life balance'],
    avatarArchetype: 'VISIONARY',
    sleepHours: 6.5,
    workloadHrsWk: 65,
    timezone: 'America/Los_Angeles',
    consentAt: new Date(),
  });

  console.log('✅ Created demo profile');

  // 3. Create EXCLUSIVE subscription (all features unlocked)
  await db.insert(subscriptions).values({
    userId: demoUser.id,
    provider: 'STRIPE',
    planType: 'EXCLUSIVE_99',
    status: 'ACTIVE',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });

  console.log('✅ Created EXCLUSIVE subscription');

  // 4. Create realistic EI snapshots (30 days of data)
  const eiData = [];
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Simulate realistic founder journey with ups and downs
    const dayPhase = i % 7;
    let state: 'FIGHT' | 'FLIGHT' | 'FREEZE' | 'REGULATED';
    let baseScore: number;
    
    if (dayPhase === 0) { // Sunday - better regulated
      state = 'REGULATED';
      baseScore = 75;
    } else if (dayPhase === 1 || dayPhase === 5) { // Mon/Fri - high stress
      state = 'FIGHT';
      baseScore = 55;
    } else if (dayPhase === 3) { // Wed - burnout risk
      state = 'FREEZE';
      baseScore = 45;
    } else {
      state = i < 10 ? 'REGULATED' : 'FLIGHT'; // Recent improvement
      baseScore = i < 10 ? 70 : 60;
    }
    
    const variance = Math.random() * 10 - 5;
    const score = Math.round(Math.max(0, Math.min(100, baseScore + variance)));
    
    eiData.push({
      userId: demoUser.id,
      score,
      focusEfficiency: Math.round(score + (Math.random() * 10 - 5)),
      recoveryLatency: Math.round(score + (Math.random() * 10 - 5)),
      decisionClarity: Math.round(score + (Math.random() * 10 - 5)),
      emotionRegulation: Math.round(score + (Math.random() * 10 - 5)),
      supportUtilization: Math.round(score + (Math.random() * 10 - 5)),
      strategicMomentum: Math.round(score + (Math.random() * 10 - 5)),
      state,
      createdAt: date,
    });
  }
  
  await db.insert(eiSnapshots).values(eiData);
  console.log('✅ Created 31 days of EI snapshots');

  // 5. Create curated journal entries
  const journalEntries = [
    {
      title: 'Tough Investor Meeting',
      content: 'Today\'s pitch didn\'t go as planned. They questioned our burn rate and runway. Feeling anxious but also motivated to prove them wrong.',
      tags: ['fundraising', 'anxiety', 'motivation'],
      daysAgo: 5,
    },
    {
      title: 'Team Win 🎉',
      content: 'Sarah closed that enterprise deal we\'ve been working on for 3 months! The team is energized. Moments like these remind me why we\'re building this.',
      tags: ['team', 'success', 'grateful'],
      daysAgo: 3,
    },
    {
      title: 'Overwhelmed',
      content: 'Can\'t sleep. Too many decisions to make - hiring, product roadmap, fundraising timeline. Need to delegate more but struggling to let go.',
      tags: ['stress', 'insomnia', 'control'],
      daysAgo: 7,
    },
    {
      title: 'Breakthrough Moment',
      content: 'Finally figured out our positioning! After weeks of customer interviews, the value prop is crystal clear. Excited to test this messaging.',
      tags: ['product', 'clarity', 'excitement'],
      daysAgo: 1,
    },
    {
      title: 'Personal Reflection',
      content: 'Realized I haven\'t called my parents in 2 weeks. The startup consumes everything. Need better boundaries between work and life.',
      tags: ['work-life-balance', 'family', 'reflection'],
      daysAgo: 10,
    },
  ];

  for (const entry of journalEntries) {
    const date = new Date();
    date.setDate(date.getDate() - entry.daysAgo);
    
    // Simplified "encryption" for demo - just base64 encode
    const encryptedContent = Buffer.from(entry.content).toString('base64');
    
    await db.insert(journals).values({
      userId: demoUser.id,
      title: entry.title,
      bodyCipher: encryptedContent,
      tags: entry.tags,
      summary: entry.content.substring(0, 100) + '...',
      createdAt: date,
    });
  }
  
  console.log('✅ Created 5 curated journal entries');

  // 6. Create active therapeutic programs
  const programs = [
    {
      programCode: 'FOUNDER-RESILIENCE-14D',
      name: 'Founder Resilience Program',
      totalDays: 14,
      currentDay: 8,
      startDaysAgo: 7,
    },
    {
      programCode: 'DECISION-CLARITY-7D',
      name: 'Decision Clarity Framework',
      totalDays: 7,
      currentDay: 4,
      startDaysAgo: 3,
    },
    {
      programCode: 'STRESS-RECOVERY-21D',
      name: 'Stress Recovery Protocol',
      totalDays: 21,
      currentDay: 2,
      startDaysAgo: 1,
    },
  ];

  for (const program of programs) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - program.startDaysAgo);
    
    const [assignment] = await db.insert(programAssignments).values({
      userId: demoUser.id,
      programCode: program.programCode,
      currentDay: program.currentDay,
      totalDays: program.totalDays,
      startAt: startDate,
      status: 'ACTIVE',
      metadata: { programName: program.name },
    }).returning();

    // Add some completed steps
    for (let day = 1; day <= program.currentDay - 1; day++) {
      const stepDate = new Date(startDate);
      stepDate.setDate(stepDate.getDate() + day - 1);
      
      await db.insert(programSteps).values({
        assignmentId: assignment.id,
        day,
        title: `${program.name} - Day ${day}`,
        content: `Completed step ${day} of ${program.totalDays}`,
        completed: true,
        completedAt: stepDate,
      });
    }

    // Add current step (not completed)
    await db.insert(programSteps).values({
      assignmentId: assignment.id,
      day: program.currentDay,
      title: `${program.name} - Day ${program.currentDay}`,
      content: `Current step: Practice mindful breathing for 10 minutes and reflect on today's challenges.`,
      completed: false,
    });
  }
  
  console.log('✅ Created 3 active programs with progress');

  // 7. Create zen mode sessions
  const zenSessionData = [
    { duration: 15, completed: true, daysAgo: 1, breathingPattern: '4-7-8' },
    { duration: 20, completed: true, daysAgo: 2, breathingPattern: 'box' },
    { duration: 10, completed: true, daysAgo: 3, breathingPattern: '4-7-8' },
    { duration: 30, completed: true, daysAgo: 5, breathingPattern: 'coherent' },
    { duration: 15, completed: false, daysAgo: 0, breathingPattern: '4-7-8' }, // Today's incomplete
  ];

  for (const session of zenSessionData) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - session.daysAgo);
    
    await db.insert(zenSessions).values({
      userId: demoUser.id,
      duration: session.duration,
      completed: session.completed,
      breathingPattern: session.breathingPattern,
      startedAt: startDate,
      completedAt: session.completed ? new Date(startDate.getTime() + session.duration * 60000) : null,
    });
  }
  
  console.log('✅ Created 5 zen mode sessions');

  console.log('\n🎉 Demo account created successfully!');
  console.log('📧 Email:', DEMO_EMAIL);
  console.log('🔑 Password:', DEMO_PASSWORD);
  console.log('💎 Plan: EXCLUSIVE (all features unlocked)');
}

seedDemo()
  .then(() => {
    console.log('\n✨ Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
