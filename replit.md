# AuraVerse AI - Mental-Performance OS for Entrepreneurs

## Overview

AuraVerse AI is the world's first mental-performance OS specifically designed for entrepreneurs and startup founders. The application provides real-time resilience tracking through a proprietary Resilience Index (RI), Behavioral Optimization Sprint System (BOSS), encrypted journaling, zen mode sessions, and calendar integration. Built as a full-stack TypeScript application with a React frontend and Express backend, it emphasizes privacy, data security, and founder-specific mental resilience support.

## User Preferences

Preferred communication style: Simple, everyday language.

**Design Theme (Modern Purple UI/UX):**
- **Background**: Deep purple (`#281A3E` / `270 50% 12%`) - rich, professional base
- **Text**: Pure white (`#FFFFFF` / `0 0% 100%`) for primary content, light gray (`#BFBFBF` / `0 0% 75%`) for secondary text
- **Primary Color**: Vibrant purple (`#A78BFA` / `270 75% 65%`) - interactive elements, CTAs, highlights
- **Cards**: Slightly lighter purple (`#33234D` / `270 45% 16%`) with subtle purple borders
- **Borders**: Purple tinted (`#5C4470` / `270 30% 30%`)
- **Shadows**: Purple-tinted shadows for depth and modern feel
- **UI/UX Features**:
  - Enhanced glassmorphism effects with backdrop blur
  - Smooth hover animations with lift effects (4px translateY)
  - Purple glow on interactive elements
  - Gradient animations for premium feel
  - Rounded corners (0.75rem border radius)
  - Modern card shadows with purple tint
  - Smooth transitions using cubic-bezier easing
- Logo prominently displayed in header, landing page, and splash screen
- Splash screen shown on first visit with animated logo reveal

**Mobile Responsiveness:**
- **Breakpoints**: Mobile < 640px (sm), Tablet 640px-1024px (md/lg), Desktop ≥ 1024px (lg/xl)
- **Landing Page**: Fully responsive with adaptive typography, stacked CTAs on mobile, 1-column mobile → 2-column tablet → 3-column desktop grids
- **Navigation**: 
  - Desktop (≥1024px): Fixed left sidebar with all navigation items and user profile
  - Mobile (<1024px): Bottom navigation bar with all 7 navigation items in 6-column grid (Dashboard, AI Oracle, Programs, Zen Mode, Journal, Media Analysis, Insights)
- **Header**: Responsive logo sizing (h-8 on mobile → h-12 on desktop), search bar hidden on mobile (icon-only)
- **Content Padding**: Global mobile padding-bottom (5rem) prevents overlap with bottom navigation
- **All Pages**: Optimized for touch targets and no horizontal scrolling on any screen size

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theming (neutral base color, CSS variables for theme tokens)
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with route registration system
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Build System**: esbuild for production bundling

### Database Design
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Location**: `/shared/schema.ts` for shared types between frontend and backend
- **Key Tables**:
  - `users` - User accounts with Stripe integration fields
  - `profiles` - User preferences (venture stage, avatar archetype, stressors, timezone)
  - `journals` - Encrypted journal entries with client-side encryption
  - `eiSnapshots` - Resilience Index measurements with 6 sub-indices (maintained as 'ei' for legacy compatibility)
  - `programAssignments` - User enrollment in BOSS (Behavioral Optimization Sprint System) programs
  - `programSteps` - Daily BOSS program step tracking
  - `zenSessions` - Meditation/focus session logs
  - `calendarCreds` - Google Calendar OAuth credentials
  - `subscriptions` - Payment plan management (Basic $5, Growth $29, Inclusive $99, Elite $999)
  - `mediaAnalysisSessions` - Before-After Reflection Analysis sessions with AI insights
  - `wearableConnections` - Connected wearable devices (Apple Watch, Fitbit, Oura, WHOOP, Garmin)
  - `wearableData` - Health metrics from wearable devices (heart rate, HRV, sleep, steps, calories)

### Core Features & Algorithms

**Resilience Index (RI) Computation** (internally still called EI for legacy compatibility):
- 6-metric scoring system: Focus Efficiency, Recovery Latency, Decision Clarity, Emotion Regulation, Support Utilization, Strategic Momentum
- Outputs FFF state classification (FIGHT/FLIGHT/FREEZE/REGULATED)
- Located in `/server/lib/ei.ts`

**Client-Side Encryption**:
- Journal entries encrypted using Web Crypto API (AES-GCM)
- PBKDF2 key derivation from user passwords
- Encryption happens entirely in browser before transmission
- Implementation in `/client/src/lib/crypto.ts` and `/server/lib/encryption.ts`

**AI Program Generation**:
- Dual AI provider support: OpenAI (GPT-5) and Anthropic (Claude Sonnet 4)
- Generates personalized therapeutic program steps based on user profile and calendar context
- Crisis language detection for safety protocols
- Located in `/server/openai.ts` and `/server/anthropic.ts`

**Before-After Reflection Analysis**:
- Real-time recording interface supporting Voice, Video, or Both modes
- Browser MediaRecorder API with live preview and duration tracking (using refs to avoid closure issues)
- AI analysis of vocal stress, emotional state, speech pace, facial expressions, body language for growth visualization
- Session history with timestamps showing progress over time and AI-generated wellness recommendations
- Located in `/client/src/pages/media-analysis.tsx`

**Wearable Device Integration**:
- Support for 5 major wearable platforms: Apple Watch, Fitbit, Oura, WHOOP, Garmin
- Database schema for device connections and health metrics (heart rate, HRV, sleep, steps, calories)
- Dashboard card showing connection status and device management
- OAuth token storage for secure device authentication
- Located in `/client/src/components/dashboard/wearable-card.tsx`

**Interactive Dashboard Tour**:
- First-time user onboarding with 7-step guided tour
- Element highlighting, smooth scrolling, and mobile responsiveness
- Data-aware start (waits for dashboard data to load before showing)
- localStorage flag to show tour only once
- Located in `/client/src/components/dashboard/dashboard-tour.tsx`

### Authentication & Authorization
- JWT tokens stored in localStorage with 7-day expiration
- Token-based middleware for protected routes
- Password hashing with bcrypt (12 rounds)
- Mock authentication service for development (`/client/src/lib/auth.ts`)
- Production-ready auth structure in `/server/lib/auth.ts`

### API Structure
- `/api/auth/*` - Authentication endpoints (register, login)
- `/api/me` - User profile retrieval
- `/api/journal/*` - Encrypted journal CRUD operations
- `/api/programs/*` - Therapeutic program management
- `/api/zen/*` - Zen mode session tracking
- `/api/ei/*` - Effectiveness Index snapshots and trends
- `/api/insights/*` - Data correlation and analytics
- `/api/billing/*` - Stripe checkout and subscription management
- `/api/calendar/*` - Google Calendar integration endpoints
- `/api/privacy/*` - Data export and privacy controls
- `/api/media/*` - Voice/video recording analysis (GET sessions, POST analyze)
- `/api/wearables/*` - Wearable device connection management

## External Dependencies

### Third-Party Services
- **Payment Processing**: Stripe (with webhook support for subscription events)
- **AI Providers**: 
  - OpenAI API (GPT-5 model)
  - Anthropic API (Claude Sonnet 4 fallback)
- **Calendar Integration**: Google Calendar API with OAuth 2.0 and push notifications
- **Database**: Neon Serverless PostgreSQL (via @neondatabase/serverless)

### Key NPM Packages
- **UI Framework**: React 18+ with TypeScript
- **Backend**: Express.js with middleware for JSON/URL-encoded bodies
- **Database**: Drizzle ORM with Drizzle Kit for migrations
- **Validation**: Zod for schema validation
- **Authentication**: jsonwebtoken, bcrypt
- **Payment**: @stripe/stripe-js, @stripe/react-stripe-js
- **API Client**: @tanstack/react-query for data fetching
- **AI SDKs**: @anthropic-ai/sdk, openai
- **Google APIs**: googleapis for Calendar integration

### Environment Configuration
Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook validation
- `OPENAI_API_KEY` - OpenAI API access
- `ANTHROPIC_API_KEY` - Anthropic API access
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
- `REPLIT_CONNECTORS_HOSTNAME` / `REPL_IDENTITY` - Replit connector integration

### Development Tools
- Vite with React plugin for HMR
- Replit-specific plugins: runtime error overlay, cartographer, dev banner
- PostCSS with Tailwind CSS and Autoprefixer
- TypeScript strict mode with path aliases (`@/*`, `@shared/*`, `@assets/*`)