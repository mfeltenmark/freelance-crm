# 🚀 Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (or Supabase account)
- Git installed
- Code editor (VS Code recommended)

---

## Setup Steps (15 minuter)

### 1. Clone & Install Dependencies

```bash
cd /path/to/your/workspace
git clone [your-repo] freelance-crm
cd freelance-crm

# Install dependencies
npm install
```

### 2. Setup Database

**Option A: Supabase (Recommended - Gratis tier)**

1. Gå till https://supabase.com
2. Skapa nytt projekt
3. Vänta ~2 minuter på setup
4. Gå till Settings → Database
5. Kopiera "Connection string" (URI format)

**Option B: Local PostgreSQL**

```bash
# macOS
brew install postgresql
brew services start postgresql
createdb freelance_crm

# Ubuntu/Debian
sudo apt install postgresql
sudo service postgresql start
sudo -u postgres createdb freelance_crm
```

### 3. Environment Variables

Skapa `.env.local` fil i root:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Om Supabase
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Auth (generera med: openssl rand -base64 32)
NEXTAUTH_SECRET="din-secret-key-här"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Future features
ANTHROPIC_API_KEY="sk-ant-..."
RESEND_API_KEY="re_..."
```

### 4. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

Du bör se:
```
✅ Created 3 sample companies
✅ Created 3 sample contacts
✅ Created 4 sample leads
✅ Created 4 sample activities
✅ Created 1 sample proposal
✅ Created 3 email templates

📊 Database seeded successfully!
```

### 5. Start Development Server

```bash
npm run dev
```

Öppna http://localhost:3000

---

## Project Structure Tour

```
freelance-crm/
│
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   └── api/                # API routes
│       └── leads/
│           └── route.ts    # GET/POST /api/leads
│
├── components/             # React components
│   ├── ui/                 # shadcn components
│   └── leads/
│       ├── LeadCard.tsx
│       └── KanbanBoard.tsx
│
├── lib/                    # Utilities
│   ├── db.ts              # Prisma client
│   └── utils.ts           # Helper functions
│
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Sample data
│
└── docs/                  # Documentation
    ├── database-schema.md
    ├── product-requirements.md
    ├── tech-stack.md
    └── api-design.md
```

---

## Development Workflow

### Daily Development

```bash
# 1. Start dev server
npm run dev

# 2. Open Prisma Studio (visual DB editor)
npm run db:studio
# Opens at http://localhost:5555

# 3. Make changes to code
# Next.js auto-reloads on save

# 4. If you change schema.prisma:
npm run db:push
npm run db:generate
```

### Common Tasks

**Add new database table:**
```bash
# 1. Edit prisma/schema.prisma
# 2. Push changes
npm run db:push
npm run db:generate
```

**Install new UI component:**
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
```

**Debug database:**
```bash
npm run db:studio
# Visual interface för all data
```

**Reset database:**
```bash
npm run db:push -- --force-reset
npm run db:seed
```

---

## Build Your First Feature

### Example: Lead List Page

**1. Create API Route**
```typescript
// app/api/leads/route.ts
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const leads = await prisma.lead.findMany({
    include: {
      company: true,
    },
    orderBy: {
      leadScore: 'desc',
    },
  })
  
  return NextResponse.json({ leads })
}
```

**2. Create Page Component**
```typescript
// app/leads/page.tsx
import { prisma } from '@/lib/db'

async function getLeads() {
  return await prisma.lead.findMany({
    include: { company: true },
    orderBy: { leadScore: 'desc' },
  })
}

export default async function LeadsPage() {
  const leads = await getLeads()
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Leads</h1>
      
      <div className="grid gap-4">
        {leads.map((lead) => (
          <div key={lead.id} className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold">{lead.title}</h2>
            <p className="text-gray-600">{lead.company?.name}</p>
            <div className="mt-2 flex gap-4">
              <span className="text-sm">Score: {lead.leadScore}</span>
              <span className="text-sm">Value: {lead.estimatedValue} SEK</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**3. Test it**
- Gå till http://localhost:3000/leads
- Du ska se alla leads från seed data!

---

## Phase 1: MVP Features (Vecka 1-2)

### Must-Have Features

- [ ] **Lead List View** - Se alla leads i en lista
- [ ] **Lead Detail View** - Klicka på lead för mer info
- [ ] **Create Lead Form** - Lägg till ny lead
- [ ] **Basic Kanban Board** - Dra leads mellan stages
- [ ] **Activity Log** - Visa timeline av aktiviteter

### Tech Stack för MVP

```typescript
// Components you'll use
- shadcn/ui Button, Dialog, Select, Input
- TanStack Query för data fetching
- Zustand för kanban drag state
- date-fns för date formatting
```

### Suggested Build Order

1. **Day 1-2**: Lead list + detail pages
2. **Day 3-4**: Create/Edit lead forms
3. **Day 5-6**: Kanban board med drag & drop
4. **Day 7**: Activity timeline
5. **Day 8-10**: Polish + bug fixes

---

## Useful Commands Cheat Sheet

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production
npm run start              # Run production build

# Database
npm run db:studio          # Visual DB editor
npm run db:push            # Update DB schema
npm run db:migrate         # Create migration
npm run db:seed            # Add sample data

# Code Quality
npm run lint               # Check code style
npm run type-check         # Check TypeScript
```

---

## Pro Tips

### 1. Use Prisma Studio
Det är enklare än du tror! Kör `npm run db:studio` och få en visuell editor för din data.

### 2. Server Components First
Börja med Server Components (default i Next.js 15):
```typescript
// No 'use client' needed
async function MyPage() {
  const data = await prisma.lead.findMany()
  return <div>{/* render */}</div>
}
```

Lägg till `'use client'` bara när du behöver interaktivitet.

### 3. Type Safety
Prisma ger dig autocompletion överallt:
```typescript
const lead = await prisma.lead.findFirst({
  include: {
    company: true, // TypeScript vet vilka fält som finns!
  }
})

lead.company?.name // Type-safe!
```

### 4. Quick Iterations
Fokusera på funktionalitet först, polish senare:
- MVP = Ugly but works
- V2 = Pretty and works
- V3 = Pretty, fast, and polished

### 5. Test med Riktig Data
Seed-filen har realistisk data. Lägg till mer om du behöver:
```typescript
// prisma/seed.ts
await prisma.lead.create({
  data: {
    title: 'Ditt projekt',
    // ... more fields
  }
})
```

---

## Troubleshooting

### "Can't connect to database"
```bash
# Check DATABASE_URL in .env.local
# Make sure PostgreSQL is running

# Supabase: Check if IP is whitelisted
# Local: Try:
psql -h localhost -U postgres
```

### "Module not found"
```bash
npm install
npm run dev
```

### "Prisma Client not generated"
```bash
npm run db:generate
```

### "Too many re-renders"
Ofta pga state update i render. Flytta till useEffect:
```typescript
// ❌ Bad
function Component() {
  setData(newData) // infinite loop!
}

// ✅ Good
function Component() {
  useEffect(() => {
    setData(newData)
  }, [])
}
```

---

## Next Steps

När du har MVP klar:

1. **Deploy till Vercel** (5 minuter)
   - git push
   - Importera projekt på vercel.com
   - Klart!

2. **Lägg till Auth**
   - NextAuth.js setup
   - Google/Email login

3. **Advanced Features**
   - Email integration (Gmail API)
   - Lead scoring algorithm
   - Analytics dashboard
   - AI email drafts (Claude API)

4. **Mobile App** (optional)
   - React Native med samma API
   - Eller: Progressive Web App

---

## Learning Resources

**Next.js:**
- https://nextjs.org/docs
- https://nextjs.org/learn

**Prisma:**
- https://www.prisma.io/docs
- https://www.prisma.io/docs/guides

**shadcn/ui:**
- https://ui.shadcn.com
- https://ui.shadcn.com/examples

**TanStack Query:**
- https://tanstack.com/query/latest

---

## Community & Support

**Stuck?**
- Discord: [Next.js Discord](https://discord.gg/nextjs)
- Prisma Slack
- Stack Overflow

**Want to share your progress?**
- Twitter: Tag @vercel, @prisma
- LinkedIn: Share screenshots!

---

## Success Metrics

After building this CRM, you'll have:

✅ Full-stack Next.js app deployed  
✅ TypeScript + Prisma experience  
✅ Modern React patterns (Server Components)  
✅ Real-world database design  
✅ API design & implementation  
✅ Production-ready deployment  

**Most importantly:** A CRM system tailored to YOUR workflow! 🎉

---

Lycka till! Du kommer att älska att bygga detta. 🚀

*Questions? Check the docs folder eller kör `npm run db:studio` och utforska din data visuellt!*
