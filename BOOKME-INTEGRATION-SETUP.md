# BookMe → CRM Integration Setup Guide

## Quick Start (15 minuter)

### Step 1: Setup Environment Variables

#### I CRM projektet (.env.local)
```env
# Generate webhook secret
CRM_WEBHOOK_SECRET="[run: openssl rand -base64 32]"

# Example result:
CRM_WEBHOOK_SECRET="K8s9mP2nQ5rT7vW3xY6zA1bC4dE0fG9hI8jK7lM6nO5"
```

#### I BookMe projektet (.env.local)
```env
# Point to your CRM (local development)
CRM_WEBHOOK_URL="http://localhost:3000"

# Same secret as CRM
CRM_WEBHOOK_SECRET="K8s9mP2nQ5rT7vW3xY6zA1bC4dE0fG9hI8jK7lM6nO5"
```

---

### Step 2: Add Files to CRM Project

```bash
cd freelance-crm

# Create API endpoint
mkdir -p app/api/bookings/incoming
# Copy route.ts to: app/api/bookings/incoming/route.ts

# Create components
mkdir -p components/dashboard
# Copy UpcomingBookings.tsx to: components/dashboard/
# Copy TasksWidget.tsx to: components/dashboard/
```

---

### Step 3: Add Webhook to BookMe

#### Option A: Add to your existing booking creation

```typescript
// I BookMe: app/api/bookings/route.ts eller där du skapar bokningar

import { sendBookingToCRM, prepareBookingForCRM } from '@/lib/webhooks/crm-sync'

export async function POST(request: Request) {
  // ... din befintliga kod för att skapa bokning ...
  
  const booking = await prisma.booking.create({
    data: {
      // ... booking data
    }
  })
  
  // Send confirmation email (din befintliga kod)
  await sendConfirmationEmail(booking)
  
  // 🆕 Sync to CRM (non-blocking)
  const crmPayload = prepareBookingForCRM(booking)
  sendBookingToCRM(crmPayload).catch(error => {
    console.error('CRM sync failed:', error)
    // Logga men blocka inte bokningen
  })
  
  return NextResponse.json({ booking })
}
```

#### Option B: Use Server Action (if using Server Actions)

```typescript
// I BookMe: app/actions/booking-actions.ts

'use server'

import { sendBookingToCRM } from '@/lib/webhooks/crm-sync'

export async function createBooking(data: BookingInput) {
  const booking = await prisma.booking.create({ data })
  
  // Sync to CRM
  await sendBookingToCRM({
    bookingId: booking.id,
    eventType: booking.eventType,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    company: booking.company,
    scheduledDate: booking.scheduledStart.toISOString(),
    duration: booking.duration,
    meetingUrl: booking.meetingUrl,
    notes: booking.notes,
    source: 'bookme',
    createdAt: booking.createdAt.toISOString(),
  })
  
  return booking
}
```

---

### Step 4: Add to CRM Dashboard

```typescript
// I CRM: app/dashboard/page.tsx

import { UpcomingBookings } from '@/components/dashboard/UpcomingBookings'
import { TasksWidget } from '@/components/dashboard/TasksWidget'

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* Existing widgets */}
      <PipelineOverview />
      
      {/* 🆕 New widgets */}
      <UpcomingBookings />
      <TasksWidget />
      
      {/* Other widgets */}
    </div>
  )
}
```

---

### Step 5: Test Integration

#### Local Testing (Both apps running)

```bash
# Terminal 1: CRM
cd freelance-crm
npm run dev
# → http://localhost:3000

# Terminal 2: BookMe
cd bookme
npm run dev -- -p 3001
# → http://localhost:3001

# Terminal 3: Test webhook manually
curl -X POST http://localhost:3000/api/bookings/incoming \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: K8s9mP2nQ5rT7vW3xY6zA1bC4dE0fG9hI8jK7lM6nO5" \
  -d '{
    "bookingId": "test-123",
    "eventType": "workshop",
    "name": "Test Testsson",
    "email": "test@example.com",
    "phone": "+46701234567",
    "company": "TestAB",
    "scheduledDate": "2026-02-20T10:00:00Z",
    "duration": 120,
    "meetingUrl": "https://meet.google.com/abc-defg-hij",
    "notes": "Vill lära sig om digital transformation",
    "source": "bookme",
    "createdAt": "2026-01-14T09:00:00Z"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "lead": {
    "id": "clx...",
    "title": "workshop - TestAB",
    "stage": "CONTACTED"
  },
  "contact": {
    "id": "clx...",
    "email": "test@example.com",
    "name": "Test Testsson"
  },
  "activity": {
    "id": "clx...",
    "scheduledDate": "2026-02-20T10:00:00.000Z"
  },
  "tasks": [
    {
      "id": "clx...",
      "title": "Send workshop preparation info",
      "dueDate": "2026-02-13T09:00:00.000Z"
    },
    {
      "id": "clx...",
      "title": "Workshop follow-up",
      "dueDate": "2026-02-21T10:00:00.000Z"
    }
  ]
}
```

#### Verify in CRM

1. Gå till http://localhost:3000
2. Du ska se:
   - **Lead**: "workshop - TestAB" i leads-listan
   - **Contact**: "Test Testsson" (test@example.com)
   - **Upcoming Booking**: 20 Feb 10:00 i dashboard
   - **Tasks**: 2 tasks skapade (prep info + follow-up)

---

### Step 6: Production Deployment

#### Deploy CRM
```bash
cd freelance-crm
git add .
git commit -m "Add BookMe integration"
git push

# På Vercel:
# 1. Lägg till CRM_WEBHOOK_SECRET i Environment Variables
# 2. Deploy

# Result: https://crm.techchange.io
```

#### Update BookMe Environment Variables
```env
# På Vercel för BookMe:
CRM_WEBHOOK_URL="https://crm.techchange.io"
CRM_WEBHOOK_SECRET="K8s9mP2nQ5rT7vW3xY6zA1bC4dE0fG9hI8jK7lM6nO5"
```

#### Test Production
Skapa en riktig bokning på book.techchange.io och verifiera att den dyker upp i CRM!

---

## What Gets Created Automatically?

När någon bokar på BookMe skapas följande i CRM:

### For Workshop Booking
```
✅ Lead: "workshop - [Company]"
   - Stage: CONTACTED
   - Value: 15,000 SEK
   - Score: 60

✅ Contact: [Name] ([email])
   - Tags: bookme, workshop

✅ Activity: Meeting scheduled
   - Type: MEETING
   - Date: [Booking date]
   - Duration: 120 min
   - Meeting URL included

✅ Tasks created:
   1. "Send prep info" (7 days before)
   2. "Send reminder" (1 day before)
   3. "Follow-up" (1 day after)
```

### For 30-min Consultation
```
✅ Lead: "30min-consultation - [Company]"
   - Stage: CONTACTED
   - Value: 5,000 SEK
   - Score: 60

✅ Contact: [Name] ([email])
   - Tags: bookme, 30min-consultation

✅ Activity: Meeting scheduled
   - Type: MEETING
   - Date: [Booking date]
   - Duration: 30 min

✅ Tasks created:
   1. "Send reminder" (1 day before)
   2. "Prepare for consultation" (1 hour before)
   3. "Send summary" (3 hours after)
```

---

## Manual Entry Option

Om webhooks inte funkar eller för historiska bokningar:

### Quick Import Button in CRM

```typescript
// Add to: app/leads/page.tsx

<Button onClick={() => importFromBookMe()}>
  <Calendar className="w-4 h-4 mr-2" />
  Importera från BookMe
</Button>

// Modal opens:
// - Paste BookMe booking ID
// - Or manually enter: name, email, date
// - Click "Import"
// - Same flow as webhook
```

---

## Monitoring & Debugging

### Check Webhook Logs

#### In CRM (Vercel Logs)
```bash
vercel logs --follow
```

Leta efter:
```
✅ Booking synced to CRM: { lead: {...}, contact: {...} }
❌ Failed to sync booking to CRM: [error]
```

#### In BookMe
```bash
# Look for:
console.log('Sending booking to CRM:', payload)
console.log('CRM sync response:', result)
```

### Common Issues

**❌ "Unauthorized" (401)**
→ Webhook secret mismatch. Check .env variables.

**❌ "Invalid payload" (400)**
→ Check booking data structure matches schema.

**❌ "Connection refused"**
→ CRM not running or wrong URL.

**❌ Duplicate leads created**
→ Check lead uniqueness logic in processBooking()

---

## Future Enhancements

### 1. Bi-directional Sync
Update BookMe when meeting rescheduled in CRM:
```typescript
// In CRM: When activity date changes
await updateBookingInBookMe(bookingId, {
  newScheduledDate: activity.activityDate,
})
```

### 2. Cancellation Handling
```typescript
// In BookMe: When booking cancelled
await updateBookingInCRM(bookingId, {
  status: 'cancelled'
})

// CRM marks activity as cancelled + removes tasks
```

### 3. No-Show Tracking
```typescript
// Add to CRM: Mark activity as no-show
// BookMe gets notified
// Auto-send "Sorry we missed you" email
```

### 4. Automatic Email Sending
```typescript
// In CRM: When task due date arrives
if (task.title === 'Send workshop prep info') {
  await sendEmail({
    template: 'workshop-prep',
    to: lead.contact.email,
    data: { workshopDate, meetingUrl }
  })
  
  await markTaskComplete(task.id)
}
```

---

## Troubleshooting Checklist

- [ ] CRM_WEBHOOK_SECRET samma i båda projekten
- [ ] CRM_WEBHOOK_URL pekar på rätt domän
- [ ] API endpoint finns: /api/bookings/incoming/route.ts
- [ ] Prisma client genererad: `npm run db:generate`
- [ ] Database schema uppdaterad: `npm run db:push`
- [ ] Webhook kod lagd till i BookMe booking creation
- [ ] Båda apps körs (local) eller deployade (production)
- [ ] Check Vercel logs för errors

---

## Success Metrics

**After 1 week:**
- ✅ All bookings automatically in CRM
- ✅ Zero manual data entry
- ✅ Tasks created for all bookings
- ✅ Follow-ups happening on time

**After 1 month:**
- 📈 Track workshop → customer conversion
- 📊 See which consultations lead to projects
- 🎯 Measure response time to new bookings
- 💰 Calculate ROI of each booking type

---

**Ready to go! När du bokar din första kund på BookMe kommer den automatiskt dyka upp i CRM med alla tasks klara. Magic! ✨**
