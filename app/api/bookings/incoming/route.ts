import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const BookingSchema = z.object({
  bookingId: z.string(),
  eventType: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  scheduledDate: z.string(),
  duration: z.number(),
  meetingUrl: z.string().optional(),
  notes: z.string().optional(),
  source: z.literal('bookme'),
  createdAt: z.string(),
})

type BookingPayload = z.infer<typeof BookingSchema>

export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook secret
    const secret = request.headers.get('x-webhook-secret')
    if (secret !== process.env.CRM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 2. Parse and validate payload
    const body = await request.json()
    const result = BookingSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Invalid payload', 
        details: result.error.format(),
      }, { status: 400 })
    }
    
    const booking = result.data
    
    // 3. Process booking in transaction
    const result_data = await processBooking(booking)
    
    return NextResponse.json({
      success: true,
      ...result_data,
    })
    
  } catch (error) {
    console.error('Error processing booking webhook:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

async function processBooking(booking: BookingPayload) {
  return await prisma.$transaction(async (tx) => {
    // 1. Find or create contact
    const [firstName, ...lastNameParts] = booking.name.split(' ')
    const lastName = lastNameParts.join(' ') || ''
    
    const contact = await tx.contact.upsert({
      where: { email: booking.email },
      update: {
        firstName,
        lastName,
        phone: booking.phone,
        tags: {
          set: Array.from(new Set([
            ...(await tx.contact.findUnique({ 
              where: { email: booking.email },
              select: { tags: true },
            }))?.tags || [],
            'bookme',
            booking.eventType,
          ])),
        },
      },
      create: {
        firstName,
        lastName,
        email: booking.email,
        phone: booking.phone,
        tags: ['bookme', booking.eventType],
      },
    })
    
    // 2. Find or create company (if provided)
    let companyId = null
    if (booking.company) {
      // Find existing company or create new
      let company = await tx.company.findFirst({
        where: { name: booking.company }
      })
      if (!company) {
        company = await tx.company.create({
          data: {
            name: booking.company,
            tags: ['bookme'],
          }
        })
      }
      companyId = company.id
      
      // Link contact to company
      await tx.contact.update({
        where: { id: contact.id },
        data: { companyId: company.id },
      })
    }
    
    // 3. Create or update lead
    // Unique constraint: combination of email + event type
    const leadTitle = booking.company 
      ? `${booking.eventType} - ${booking.company}`
      : `${booking.eventType} - ${firstName} ${lastName}`
    
    // Try to find existing lead for this customer + event type
    const existingLead = await tx.lead.findFirst({
      where: {
        companyId: companyId,
        title: {
          contains: booking.eventType,
        },
        status: 'ACTIVE',
      },
    })
    
    const lead = existingLead 
      ? await tx.lead.update({
          where: { id: existingLead.id },
          data: {
            lastActivityDate: new Date(),
            leadScore: Math.max(existingLead.leadScore, 60), // Boost score if they book again
          },
        })
      : await tx.lead.create({
          data: {
            title: leadTitle,
            description: `Booked via BookMe: ${booking.eventType}${booking.notes ? `\n\nCustomer notes: ${booking.notes}` : ''}`,
            companyId,
            stage: 'CONTACTED',
            status: 'ACTIVE',
            source: 'BookMe',
            sourceDetails: { 
              bookingId: booking.bookingId,
              eventType: booking.eventType,
            },
            estimatedValue: booking.eventType === 'workshop' ? 15000 : 5000,
            isPaid: false,
            closeProbability: 50,
            leadScore: 60, // Booked meeting = warm lead
            firstContactDate: new Date(),
            lastActivityDate: new Date(),
            tags: ['bookme', booking.eventType],
          },
        })
    
    // 4. Create activity for the booking
    const activity = await tx.activity.create({
      data: {
        leadId: lead.id,
        contactId: contact.id,
        type: 'MEETING',
        subject: `${booking.eventType} - Scheduled via BookMe`,
        description: buildActivityDescription(booking),
        activityDate: new Date(booking.scheduledDate),
        durationMinutes: booking.duration,
        outcome: 'positive', // They booked, that's positive!
        metadata: {
          bookingId: booking.bookingId,
          meetingUrl: booking.meetingUrl,
          source: 'bookme',
          eventType: booking.eventType,
        },
      },
    })
    
    // 5. Create follow-up tasks based on event type
    const tasks = await createFollowUpTasks(tx, lead.id, booking)
    
    return {
      lead: { 
        id: lead.id, 
        title: lead.title,
        stage: lead.stage,
      },
      contact: { 
        id: contact.id, 
        email: contact.email,
        name: `${contact.firstName} ${contact.lastName}`,
      },
      activity: { 
        id: activity.id,
        scheduledDate: activity.activityDate,
      },
      tasks: tasks.map(t => ({ 
        id: t.id, 
        title: t.title,
        dueDate: t.dueDate,
      })),
    }
  })
}

function buildActivityDescription(booking: BookingPayload): string {
  return `
Booking Details:
- Type: ${booking.eventType}
- Date: ${new Date(booking.scheduledDate).toLocaleString('sv-SE', {
    dateStyle: 'full',
    timeStyle: 'short',
  })}
- Duration: ${booking.duration} minutes
${booking.meetingUrl ? `- Meeting URL: ${booking.meetingUrl}` : ''}
${booking.company ? `- Company: ${booking.company}` : ''}
${booking.notes ? `\nCustomer notes:\n${booking.notes}` : ''}

Source: BookMe (Booking ID: ${booking.bookingId})
  `.trim()
}

async function createFollowUpTasks(
  tx: any,
  leadId: string, 
  booking: BookingPayload
) {
  const tasks = []
  const scheduledDate = new Date(booking.scheduledDate)
  const now = new Date()
  
  if (booking.eventType === 'workshop') {
    // Task 1: Send prep info 7 days before
    const prepInfoDate = new Date(scheduledDate)
    prepInfoDate.setDate(prepInfoDate.getDate() - 7)
    prepInfoDate.setHours(9, 0, 0, 0) // 9am on that day
    
    // Only create if it's in the future
    if (prepInfoDate > now) {
      tasks.push(
        await tx.task.create({
          data: {
            leadId,
            title: 'Send workshop preparation info',
            description: `Send email to ${booking.email} with:
- Workshop agenda
- Materials needed
- Pre-work (if any)
- Logistics (link, time, duration)
- Contact info for questions

Template: Use "Workshop Prep" email template`,
            dueDate: prepInfoDate,
            priority: 'high',
            status: 'todo',
          },
        })
      )
    }
    
    // Task 2: Day before reminder
    const reminderDate = new Date(scheduledDate)
    reminderDate.setDate(reminderDate.getDate() - 1)
    reminderDate.setHours(14, 0, 0, 0) // 2pm day before
    
    if (reminderDate > now) {
      tasks.push(
        await tx.task.create({
          data: {
            leadId,
            title: 'Send workshop reminder',
            description: `Quick reminder email with:
- Tomorrow's workshop details
- Meeting link
- "Looking forward to seeing you!"`,
            dueDate: reminderDate,
            priority: 'medium',
            status: 'todo',
          },
        })
      )
    }
    
    // Task 3: Follow up 1 day after workshop
    const followUpDate = new Date(scheduledDate)
    followUpDate.setDate(followUpDate.getDate() + 1)
    followUpDate.setHours(10, 0, 0, 0) // 10am next day
    
    tasks.push(
      await tx.task.create({
        data: {
          leadId,
          title: 'Workshop follow-up',
          description: `Send thank you email with:
- Thank you for participating
- Key takeaways recap
- Additional resources
- Feedback survey link
- Discuss next steps / continued engagement

Check: Did they seem interested in further consulting?`,
          dueDate: followUpDate,
          priority: 'medium',
          status: 'todo',
        },
      })
    )
    
  } else if (booking.eventType === '30min-consultation') {
    // Task 1: Day before reminder
    const reminderDate = new Date(scheduledDate)
    reminderDate.setDate(reminderDate.getDate() - 1)
    reminderDate.setHours(14, 0, 0, 0)
    
    if (reminderDate > now) {
      tasks.push(
        await tx.task.create({
          data: {
            leadId,
            title: 'Send consultation reminder',
            description: `Quick reminder with meeting link and agenda`,
            dueDate: reminderDate,
            priority: 'medium',
            status: 'todo',
          },
        })
      )
    }
    
    // Task 2: Prep before meeting
    const prepDate = new Date(scheduledDate)
    prepDate.setHours(prepDate.getHours() - 1) // 1 hour before
    
    if (prepDate > now) {
      tasks.push(
        await tx.task.create({
          data: {
            leadId,
            title: 'Prepare for consultation',
            description: `Review:
- Their company/background
- Previous communication
- LinkedIn profile
- Potential challenges they might have

Have ready:
- Case studies
- Pricing info
- Availability for follow-up`,
            dueDate: prepDate,
            priority: 'high',
            status: 'todo',
          },
        })
      )
    }
    
    // Task 3: Follow up same day after consultation
    const followUpDate = new Date(scheduledDate)
    followUpDate.setHours(followUpDate.getHours() + 3) // 3 hours after meeting
    
    tasks.push(
      await tx.task.create({
        data: {
          leadId,
          title: 'Send consultation summary',
          description: `Send recap email with:
- Thank you for your time
- Key discussion points
- Action items (theirs and yours)
- Next steps
- Proposal (if discussed)
- When you'll follow up

Update lead stage based on interest level!`,
          dueDate: followUpDate,
          priority: 'high',
          status: 'todo',
        },
      })
    )
  }
  
  return tasks
}

// Optional: Webhook for booking updates (reschedule, cancel)
export async function PATCH(request: NextRequest) {
  try {
    const secret = request.headers.get('x-webhook-secret')
    if (secret !== process.env.CRM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { bookingId, status, newScheduledDate } = await request.json()
    
    // Find activity by bookingId
    const activity = await prisma.activity.findFirst({
      where: {
        metadata: {
          path: ['bookingId'],
          equals: bookingId,
        },
      },
    })
    
    if (!activity) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    
    if (status === 'cancelled') {
      // Update activity with cancellation note
      await prisma.activity.update({
        where: { id: activity.id },
        data: {
          subject: `${activity.subject} [CANCELLED]`,
          description: `${activity.description}\n\n⚠️ CANCELLED on ${new Date().toISOString()}`,
          outcome: 'negative',
        },
      })
      
      // Cancel related tasks
      await prisma.task.updateMany({
        where: {
          leadId: activity.leadId,
          status: 'todo',
        },
        data: {
          status: 'cancelled',
        },
      })
      
    } else if (status === 'rescheduled' && newScheduledDate) {
      // Update activity date
      await prisma.activity.update({
        where: { id: activity.id },
        data: {
          activityDate: new Date(newScheduledDate),
          description: `${activity.description}\n\n📅 RESCHEDULED to ${new Date(newScheduledDate).toLocaleString('sv-SE')}`,
        },
      })
      
      // Update task due dates proportionally
      // TODO: Implement task rescheduling logic
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
