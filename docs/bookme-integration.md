# BookMe → CRM Integration

## Overview

Automatisk synkronisering av bokningar från BookMe till CRM-systemet för att:
1. Fånga nya leads när kunder bokar
2. Tracka alla bokningar per kund
3. Automatisera follow-up actions (ex: prep-info 7 dagar före)
4. Ha en central vy över alla kundinteraktioner

---

## Integration Flow

### 1. BookMe Webhook Setup

När en bokning skapas i BookMe, skicka webhook till CRM:

```typescript
// I BookMe: lib/webhooks/crm-sync.ts

interface BookingCreatedPayload {
  bookingId: string
  eventType: 'workshop' | '30min-consultation'
  
  // Customer info
  name: string
  email: string
  phone?: string
  company?: string
  
  // Booking details
  scheduledDate: string  // ISO datetime
  duration: number       // minutes
  meetingUrl?: string
  notes?: string
  
  // Metadata
  source: 'bookme'
  createdAt: string
}

export async function sendBookingToCRM(booking: BookingCreatedPayload) {
  const CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL
  const WEBHOOK_SECRET = process.env.CRM_WEBHOOK_SECRET
  
  try {
    const response = await fetch(`${CRM_WEBHOOK_URL}/api/bookings/incoming`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': WEBHOOK_SECRET,
      },
      body: JSON.stringify(booking),
    })
    
    if (!response.ok) {
      console.error('Failed to sync booking to CRM:', await response.text())
    }
    
    return response.json()
  } catch (error) {
    console.error('Error syncing to CRM:', error)
    // Store in retry queue
  }
}
```

**När ska webhook triggas?**
- I BookMe efter booking confirmation
- Vid booking updates (reschedule, cancellation)
- Vid no-show markering

---

### 2. CRM API Endpoint

Endpoint som tar emot bokningar och skapar relevanta records:

```typescript
// I CRM: app/api/bookings/incoming/route.ts

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const BookingSchema = z.object({
  bookingId: z.string(),
  eventType: z.enum(['workshop', '30min-consultation']),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  scheduledDate: z.string(),
  duration: z.number(),
  meetingUrl: z.string().optional(),
  notes: z.string().optional(),
  source: z.literal('bookme'),
})

export async function POST(request: NextRequest) {
  // 1. Verify webhook secret
  const secret = request.headers.get('X-Webhook-Secret')
  if (secret !== process.env.CRM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 2. Parse and validate payload
  const body = await request.json()
  const result = BookingSchema.safeParse(body)
  
  if (!result.success) {
    return NextResponse.json({ 
      error: 'Invalid payload', 
      details: result.error 
    }, { status: 400 })
  }
  
  const booking = result.data
  
  try {
    // 3. Find or create contact
    const contact = await prisma.contact.upsert({
      where: { email: booking.email },
      update: {
        firstName: booking.name.split(' ')[0],
        lastName: booking.name.split(' ').slice(1).join(' ') || '',
        phone: booking.phone,
      },
      create: {
        firstName: booking.name.split(' ')[0],
        lastName: booking.name.split(' ').slice(1).join(' ') || '',
        email: booking.email,
        phone: booking.phone,
        tags: ['bookme', booking.eventType],
      },
    })
    
    // 4. Find or create company (if provided)
    let companyId = null
    if (booking.company) {
      const company = await prisma.company.upsert({
        where: { name: booking.company },
        update: {},
        create: {
          name: booking.company,
          tags: ['bookme'],
        },
      })
      companyId = company.id
      
      // Link contact to company
      await prisma.contact.update({
        where: { id: contact.id },
        data: { companyId: company.id },
      })
    }
    
    // 5. Find or create lead
    const lead = await prisma.lead.upsert({
      where: { 
        companyId_title: companyId 
          ? { companyId, title: `${booking.eventType} - ${booking.company}` }
          : undefined,
      },
      update: {
        lastActivityDate: new Date(),
      },
      create: {
        title: booking.company 
          ? `${booking.eventType} - ${booking.company}`
          : `${booking.eventType} - ${contact.firstName}`,
        description: `Booked via BookMe: ${booking.eventType}`,
        companyId,
        stage: 'CONTACTED',
        source: 'BookMe',
        sourceDetails: { 
          bookingId: booking.bookingId,
          eventType: booking.eventType,
        },
        estimatedValue: booking.eventType === 'workshop' ? 15000 : 5000,
        leadScore: 60, // Booked meeting = warm lead
        tags: ['bookme', booking.eventType],
      },
    })
    
    // 6. Create activity for the booking
    const activity = await prisma.activity.create({
      data: {
        leadId: lead.id,
        contactId: contact.id,
        type: 'MEETING',
        subject: `${booking.eventType} - Scheduled`,
        description: `
Booking Details:
- Type: ${booking.eventType}
- Date: ${new Date(booking.scheduledDate).toLocaleString('sv-SE')}
- Duration: ${booking.duration} minutes
- Meeting URL: ${booking.meetingUrl || 'N/A'}
${booking.notes ? `\nCustomer notes: ${booking.notes}` : ''}
        `.trim(),
        activityDate: new Date(booking.scheduledDate),
        durationMinutes: booking.duration,
        metadata: {
          bookingId: booking.bookingId,
          meetingUrl: booking.meetingUrl,
          source: 'bookme',
        },
      },
    })
    
    // 7. Create follow-up tasks based on event type
    const tasks = await createFollowUpTasks(lead.id, booking)
    
    return NextResponse.json({
      success: true,
      lead: { id: lead.id, title: lead.title },
      contact: { id: contact.id, email: contact.email },
      activity: { id: activity.id },
      tasks: tasks.map(t => ({ id: t.id, title: t.title })),
    })
    
  } catch (error) {
    console.error('Error processing booking:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message,
    }, { status: 500 })
  }
}

async function createFollowUpTasks(leadId: string, booking: any) {
  const tasks = []
  const scheduledDate = new Date(booking.scheduledDate)
  
  if (booking.eventType === 'workshop') {
    // Task 1: Send prep info 7 days before
    const prepInfoDate = new Date(scheduledDate)
    prepInfoDate.setDate(prepInfoDate.getDate() - 7)
    
    if (prepInfoDate > new Date()) {
      tasks.push(
        await prisma.task.create({
          data: {
            leadId,
            title: 'Send workshop prep info',
            description: 'Send email with preparation instructions, materials needed, and agenda',
            dueDate: prepInfoDate,
            priority: 'high',
            status: 'todo',
          },
        })
      )
    }
    
    // Task 2: Follow up 1 day after workshop
    const followUpDate = new Date(scheduledDate)
    followUpDate.setDate(followUpDate.getDate() + 1)
    
    tasks.push(
      await prisma.task.create({
        data: {
          leadId,
          title: 'Workshop follow-up',
          description: 'Send thank you email, gather feedback, discuss next steps',
          dueDate: followUpDate,
          priority: 'medium',
          status: 'todo',
        },
      })
    )
  } else if (booking.eventType === '30min-consultation') {
    // Task: Follow up same day after consultation
    const followUpDate = new Date(scheduledDate)
    followUpDate.setHours(scheduledDate.getHours() + 2)
    
    tasks.push(
      await prisma.task.create({
        data: {
          leadId,
          title: 'Send consultation summary',
          description: 'Send recap email with key takeaways and next steps',
          dueDate: followUpDate,
          priority: 'high',
          status: 'todo',
        },
      })
    )
  }
  
  return tasks
}
```

---

### 3. BookMe Integration in Code

Add webhook call after booking confirmation:

```typescript
// I BookMe: app/api/bookings/route.ts

import { sendBookingToCRM } from '@/lib/webhooks/crm-sync'

export async function POST(request: Request) {
  // ... existing booking creation logic ...
  
  const booking = await createBooking(data)
  
  // Send to CRM (non-blocking)
  sendBookingToCRM({
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
  }).catch(error => {
    console.error('Failed to sync to CRM:', error)
    // Log to monitoring service
  })
  
  return NextResponse.json({ booking })
}
```

---

## UI Components in CRM

### 1. Upcoming Bookings Widget (Dashboard)

```typescript
// components/dashboard/UpcomingBookings.tsx

'use client'

import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, Video } from 'lucide-react'

export function UpcomingBookings() {
  const { data: bookings } = useQuery({
    queryKey: ['upcoming-bookings'],
    queryFn: async () => {
      const res = await fetch('/api/activities?type=MEETING&upcoming=true')
      return res.json()
    },
  })
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Upcoming Bookings</h2>
      
      <div className="space-y-3">
        {bookings?.map((booking) => (
          <div key={booking.id} className="border-l-4 border-purple-500 pl-4 py-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{booking.subject}</h3>
                <p className="text-sm text-gray-600">{booking.lead?.title}</p>
              </div>
              <span className="text-xs text-gray-500">
                {formatDistance(new Date(booking.activityDate), new Date())}
              </span>
            </div>
            
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(booking.activityDate), 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {format(new Date(booking.activityDate), 'HH:mm')}
              </span>
              {booking.metadata?.meetingUrl && (
                <a 
                  href={booking.metadata.meetingUrl}
                  className="flex items-center gap-1 text-purple-600 hover:underline"
                  target="_blank"
                >
                  <Video className="w-4 h-4" />
                  Join
                </a>
              )}
            </div>
          </div>
        ))}
        
        {bookings?.length === 0 && (
          <p className="text-gray-500 text-sm">No upcoming bookings</p>
        )}
      </div>
    </div>
  )
}
```

### 2. Lead Detail - Bookings Tab

```typescript
// components/leads/BookingsTab.tsx

export function BookingsTab({ leadId }: { leadId: string }) {
  const { data: activities } = useQuery({
    queryKey: ['lead-bookings', leadId],
    queryFn: () => fetch(`/api/leads/${leadId}/activities?type=MEETING`).then(r => r.json()),
  })
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Bookings & Meetings</h3>
      
      {activities?.map((activity) => (
        <div key={activity.id} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium">{activity.subject}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {format(new Date(activity.activityDate), 'PPP')} at{' '}
                {format(new Date(activity.activityDate), 'p')}
              </p>
              {activity.description && (
                <p className="text-sm mt-2 whitespace-pre-line">{activity.description}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              {activity.metadata?.meetingUrl && (
                <a 
                  href={activity.metadata.meetingUrl}
                  className="text-sm text-purple-600 hover:underline"
                  target="_blank"
                >
                  Meeting Link
                </a>
              )}
            </div>
          </div>
          
          {activity.activityDate > new Date() && (
            <div className="mt-3 pt-3 border-t">
              <span className="text-xs text-orange-600 font-medium">
                ⏰ Upcoming in {formatDistance(new Date(activity.activityDate), new Date())}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

### 3. Tasks Widget for Follow-ups

```typescript
// components/dashboard/TasksWidget.tsx

export function TasksWidget() {
  const { data: tasks } = useQuery({
    queryKey: ['upcoming-tasks'],
    queryFn: () => fetch('/api/tasks?status=todo&upcoming=true').then(r => r.json()),
  })
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Action Items</h2>
      
      <div className="space-y-2">
        {tasks?.map((task) => (
          <div key={task.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded">
            <input 
              type="checkbox"
              className="mt-1"
              onChange={() => markTaskComplete(task.id)}
            />
            <div className="flex-1">
              <h4 className="font-medium">{task.title}</h4>
              <p className="text-sm text-gray-600">{task.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${
              task.priority === 'high' ? 'bg-red-100 text-red-700' :
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {task.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Environment Variables

### BookMe `.env.local`
```env
CRM_WEBHOOK_URL=https://your-crm.vercel.app
CRM_WEBHOOK_SECRET=your-shared-secret-key
```

### CRM `.env.local`
```env
CRM_WEBHOOK_SECRET=your-shared-secret-key
```

Generate secret:
```bash
openssl rand -base64 32
```

---

## Testing the Integration

### 1. Local Testing (Both apps running)

```bash
# Terminal 1: CRM
cd freelance-crm
npm run dev
# Runs on http://localhost:3000

# Terminal 2: BookMe  
cd bookme
npm run dev -- -p 3001
# Runs on http://localhost:3001

# Update BookMe env:
CRM_WEBHOOK_URL=http://localhost:3000
```

### 2. Test Webhook Manually

```bash
curl -X POST http://localhost:3000/api/bookings/incoming \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-secret" \
  -d '{
    "bookingId": "test-123",
    "eventType": "workshop",
    "name": "Test Person",
    "email": "test@example.com",
    "scheduledDate": "2026-02-15T10:00:00Z",
    "duration": 120,
    "source": "bookme"
  }'
```

Expected response:
```json
{
  "success": true,
  "lead": { "id": "...", "title": "workshop - Test Person" },
  "contact": { "id": "...", "email": "test@example.com" },
  "activity": { "id": "..." },
  "tasks": [
    { "id": "...", "title": "Send workshop prep info" },
    { "id": "...", "title": "Workshop follow-up" }
  ]
}
```

---

## Deployment

### Production Webhook URL

När du deployas till Vercel:

```
BookMe: https://book.techchange.io
CRM: https://crm.techchange.io (eller vad du vill)

BookMe env:
CRM_WEBHOOK_URL=https://crm.techchange.io
```

---

## Manual Entry Alternative

För manuell lead-skapande från bokningar:

```typescript
// components/leads/QuickAddFromBooking.tsx

export function QuickAddFromBooking() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Calendar className="w-4 h-4 mr-2" />
          Add from BookMe
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Booking</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input 
              placeholder="Booking ID från BookMe"
              name="bookingId"
            />
            {/* Form auto-fetches booking details */}
            <Button type="submit">Import to CRM</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Future Enhancements

1. **Bi-directional Sync**: Update BookMe when meeting is rescheduled in CRM
2. **Calendar Integration**: Show CRM tasks in Google Calendar
3. **Email Automation**: Auto-send prep info based on task due dates
4. **Analytics**: Track conversion from booking → consultation → client
5. **Cancellation Handling**: Update lead stage if booking cancelled

---

## Success Metrics

**Integration Health:**
- Webhook success rate > 99%
- Average sync time < 2 seconds
- Zero duplicate leads created

**Business Impact:**
- All bookings automatically tracked
- 100% of follow-ups scheduled
- Response time to new leads < 24 hours
- Conversion rate from consultation → client tracked
