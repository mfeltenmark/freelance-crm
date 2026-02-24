# Tech Stack & Architecture Guide

## Rekommenderad Stack (2026 Best Practices)

### Frontend
```
Next.js 15 + React 19 + TypeScript
├── App Router (Server Components där det går)
├── Tailwind CSS + shadcn/ui components
├── Zustand för client state management
├── TanStack Query för data fetching/caching
└── Recharts för analytics visualisering
```

### Backend
```
Next.js API Routes + Server Actions
├── PostgreSQL (via Supabase eller direkt)
├── Prisma ORM
├── NextAuth.js för authentication
└── Redis för caching (optional)
```

### Infrastructure
```
Deployment: Vercel (recommended) eller Railway
├── Database: Supabase (PostgreSQL + Real-time + Storage)
├── File Storage: Vercel Blob eller Supabase Storage
├── Email: Resend (modern email API)
└── Background Jobs: Inngest eller Trigger.dev
```

## Why This Stack?

### Next.js 15 (Full-stack Framework)
**Pros:**
- En kodbas för frontend OCH backend
- Server Components = snabbare initial load
- API routes = ingen separat backend behövs
- Excellent TypeScript support
- Deploy på Vercel med zero config

**Cons:**
- Lite mer learning curve vs pure React
- Backend begränsad till Node.js

**Perfect för:** Snabb prototyping, small-medium apps, solo devs

### Supabase (Backend-as-a-Service)
**Pros:**
- PostgreSQL database (robust, production-ready)
- Inbyggd auth (email, Google, etc)
- Real-time subscriptions (live updates!)
- Row Level Security (säkerhet på DB-nivå)
- Storage för filer
- Gratis tier generös för projekt som detta

**Cons:**
- Vendor lock-in (men PostgreSQL är standard)
- Lite mindre kontroll vs egen backend

**Perfect för:** Rapid development, mindre worry om infrastruktur

### shadcn/ui (Component Library)
**Pros:**
- Copy-paste components (äger koden själv!)
- Byggt på Radix UI (accessibility)
- Tailwind-baserat (easy customization)
- Gratis, ingen vendor lock-in

**Perfect för:** Snygga UIs utan att bygga allt själv

## Alternative Stacks

### Option A: Helt Serverless
```
Frontend: Next.js + Vercel
Database: Upstash Redis (för enkel data) eller PlanetScale
Auth: Clerk
Email: Resend
```
**When to use:** Ultra-simple MVP, vill deployas på 10 minuter

### Option B: Traditional Separation
```
Frontend: React (Vite) + TypeScript
Backend: Node.js + Express + TypeScript
Database: PostgreSQL + Prisma
Deploy: Frontend (Netlify) + Backend (Railway)
```
**When to use:** Vill ha tydlig separation, planerar mobile app senare

### Option C: Python Backend
```
Frontend: React
Backend: FastAPI + Python
Database: PostgreSQL + SQLAlchemy
```
**When to use:** Stark i Python, vill göra ML/AI features senare

## Folder Structure (Next.js Recommended)

```
freelance-crm/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/              # Protected routes
│   │   ├── layout.tsx            # Dashboard shell
│   │   ├── page.tsx              # Dashboard home
│   │   ├── leads/
│   │   │   ├── page.tsx          # Leads list/kanban
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Lead detail
│   │   ├── contacts/
│   │   ├── analytics/
│   │   └── settings/
│   ├── api/                      # API Routes
│   │   ├── leads/
│   │   ├── activities/
│   │   └── webhooks/
│   └── layout.tsx                # Root layout
│
├── components/                   # React components
│   ├── ui/                       # shadcn components
│   ├── leads/
│   │   ├── LeadCard.tsx
│   │   ├── LeadForm.tsx
│   │   ├── KanbanBoard.tsx
│   │   └── LeadFilters.tsx
│   ├── activities/
│   └── shared/
│       ├── Navbar.tsx
│       └── Sidebar.tsx
│
├── lib/                          # Utilities & configs
│   ├── db/
│   │   ├── schema.ts             # Prisma schema
│   │   └── queries.ts            # DB query functions
│   ├── auth/
│   │   └── config.ts             # NextAuth config
│   ├── api/
│   │   └── client.ts             # API client setup
│   ├── utils/
│   │   ├── scoring.ts            # Lead scoring logic
│   │   └── formatters.ts         # Date, currency, etc
│   └── hooks/
│       ├── useLeads.ts           # Data fetching hooks
│       └── useActivities.ts
│
├── types/                        # TypeScript types
│   ├── lead.ts
│   ├── contact.ts
│   └── activity.ts
│
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Sample data
│
├── public/                       # Static files
└── styles/                       # Global styles
    └── globals.css
```

## Database Setup (Prisma + PostgreSQL)

### Initial Prisma Schema
```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Lead {
  id                  String    @id @default(cuid())
  title               String
  description         String?
  
  stage               LeadStage @default(NEW)
  estimatedValue      Decimal?  @db.Decimal(12, 2)
  closeProbability    Int?
  leadScore           Int       @default(0)
  
  source              String?
  expectedCloseDate   DateTime?
  
  companyId           String?
  company             Company?  @relation(fields: [companyId], references: [id])
  
  activities          Activity[]
  proposals           Proposal[]
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

enum LeadStage {
  NEW
  CONTACTED
  QUALIFIED
  PROPOSAL
  NEGOTIATING
  CLOSED_WON
  CLOSED_LOST
}

model Company {
  id              String   @id @default(cuid())
  name            String
  website         String?
  industry        String?
  employeeCount   String?
  
  leads           Lead[]
  contacts        Contact[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Contact {
  id              String   @id @default(cuid())
  firstName       String
  lastName        String
  email           String   @unique
  phone           String?
  title           String?
  
  companyId       String?
  company         Company? @relation(fields: [companyId], references: [id])
  
  activities      Activity[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Activity {
  id              String   @id @default(cuid())
  type            ActivityType
  subject         String?
  description     String?
  
  leadId          String?
  lead            Lead?    @relation(fields: [leadId], references: [id])
  
  contactId       String?
  contact         Contact? @relation(fields: [contactId], references: [id])
  
  activityDate    DateTime
  
  createdAt       DateTime @default(now())
}

enum ActivityType {
  EMAIL_SENT
  EMAIL_RECEIVED
  CALL
  MEETING
  NOTE
}

model Proposal {
  id              String   @id @default(cuid())
  leadId          String
  lead            Lead     @relation(fields: [leadId], references: [id])
  
  title           String
  totalValue      Decimal  @db.Decimal(12, 2)
  status          ProposalStatus @default(DRAFT)
  
  sentDate        DateTime?
  acceptedDate    DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum ProposalStatus {
  DRAFT
  SENT
  VIEWED
  ACCEPTED
  REJECTED
}
```

## Key Libraries to Install

```bash
# Core
npm install next@latest react@latest react-dom@latest typescript @types/react @types/node

# UI
npm install tailwindcss postcss autoprefixer
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
npm install class-variance-authority clsx tailwind-merge lucide-react

# Data & State
npm install @tanstack/react-query zustand
npm install @prisma/client
npm install zod react-hook-form @hookform/resolvers

# Auth
npm install next-auth@beta

# Charts
npm install recharts

# Date handling
npm install date-fns

# Dev dependencies
npm install -D prisma
npm install -D @types/node
```

## Environment Variables

```env
# .env.local

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/crm_db"

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL="your-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Auth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="re_..."

# Optional: AI Features
ANTHROPIC_API_KEY="sk-ant-..."
```

## Development Workflow

### 1. Initial Setup
```bash
npx create-next-app@latest freelance-crm --typescript --tailwind --app
cd freelance-crm
npm install

# Setup database
npm install prisma @prisma/client
npx prisma init

# Setup shadcn
npx shadcn-ui@latest init
```

### 2. Database Workflow
```bash
# After editing prisma/schema.prisma
npx prisma migrate dev --name init

# Open Prisma Studio (DB GUI)
npx prisma studio

# Seed database
npx prisma db seed
```

### 3. Component Development
```bash
# Add shadcn components as needed
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
```

### 4. Run Development
```bash
npm run dev
# Open http://localhost:3000
```

## Production Deployment (Vercel)

### 1. Connect GitHub Repo
```bash
git init
git add .
git commit -m "Initial CRM setup"
git remote add origin your-repo-url
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to vercel.com
2. Import your GitHub repo
3. Add environment variables
4. Deploy!

### 3. Database (Supabase)
1. Create project on supabase.com
2. Copy connection string
3. Add to Vercel env vars as DATABASE_URL
4. Run migrations: `npx prisma migrate deploy`

## Performance Optimizations

### 1. React Server Components
Use for:
- Lead list (initial data)
- Dashboard metrics
- Static parts of UI

### 2. Client Components
Use for:
- Kanban drag & drop
- Forms
- Interactive filters

### 3. Data Fetching Strategy
```typescript
// Server Component - pre-fetch data
async function LeadsPage() {
  const leads = await prisma.lead.findMany()
  return <LeadsList initialData={leads} />
}

// Client Component - real-time updates
'use client'
function LeadsList({ initialData }) {
  const { data: leads } = useQuery({
    queryKey: ['leads'],
    queryFn: fetchLeads,
    initialData
  })
}
```

### 4. Caching
- Use Next.js built-in caching
- TanStack Query for client cache
- Redis för expensive queries (optional)

## Testing Strategy

```bash
# Unit tests
npm install -D vitest @testing-library/react

# E2E tests
npm install -D playwright
```

Test areas:
1. Lead CRUD operations
2. Pipeline stage transitions
3. Lead scoring algorithm
4. Activity logging
5. Proposal generation

## Monitoring & Analytics

```bash
# Error tracking
npm install @sentry/nextjs

# Analytics
npm install @vercel/analytics
```

---

## Quick Start Checklist

- [ ] Create Next.js project
- [ ] Setup Supabase database
- [ ] Initialize Prisma schema
- [ ] Install shadcn/ui
- [ ] Create Lead model & API
- [ ] Build LeadsList component
- [ ] Create Kanban board
- [ ] Add authentication
- [ ] Deploy to Vercel
- [ ] Test with real data

**Estimated time to MVP:** 2-3 veckor part-time 🚀
