import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// ============================================================
// GET - Dashboard data (upcoming bookings, stats)
// ============================================================

export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      activeLeads,
      totalLeads,
      wonThisMonth,
      totalClosed,
      pipelineValue,
      upcomingMilestones,
      recentLeads,
      overdueTaskCount,
      todayTaskCount,
    ] = await Promise.all([
      prisma.lead.count({ where: { status: 'ACTIVE' } }),
      prisma.lead.count(),
      prisma.lead.count({
        where: {
          stage: 'CLOSED_WON',
          updatedAt: { gte: startOfMonth },
        },
      }),
      prisma.lead.count({
        where: {
          stage: { in: ['CLOSED_WON', 'CLOSED_LOST'] },
        },
      }),
      prisma.lead.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { estimatedValue: true },
      }),
      prisma.lead.findMany({
        where: {
          nextStep: { not: null },
          status: 'ACTIVE',
        },
        select: {
          id: true,
          title: true,
          nextStep: true,
          nextStepDate: true,
          stage: true,
          estimatedValue: true,
          company: { select: { name: true } },
        },
        orderBy: [
          { nextStepDate: { sort: 'asc', nulls: 'last' } },
          { updatedAt: 'desc' },
        ],
        take: 5,
      }),
      prisma.lead.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          title: true,
          stage: true,
          estimatedValue: true,
          createdAt: true,
          company: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.task.count({
        where: {
          dueDate: { lt: now },
          status: { not: 'done' },
        },
      }),
      prisma.task.count({
        where: {
          dueDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
          status: { not: 'done' },
        },
      }),
    ])

    const stageDistribution = await prisma.lead.groupBy({
      by: ['stage'],
      where: { status: 'ACTIVE' },
      _count: true,
      _sum: { estimatedValue: true },
    })

    const wonCount = await prisma.lead.count({ where: { stage: 'CLOSED_WON' } })
    const conversionRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0

    return NextResponse.json({
      stats: {
        activeLeads,
        totalLeads,
        wonThisMonth,
        conversionRate,
        pipelineValue: pipelineValue._sum.estimatedValue?.toString() || '0',
        overdueTaskCount,
        todayTaskCount,
      },
      stageDistribution: stageDistribution.map((s) => ({
        stage: s.stage,
        count: s._count,
        value: s._sum.estimatedValue?.toString() || '0',
      })),
      upcomingMilestones: upcomingMilestones.map((l) => ({
        ...l,
        estimatedValue: l.estimatedValue?.toString() || null,
      })),
      recentLeads: recentLeads.map((l) => ({
        ...l,
        estimatedValue: l.estimatedValue?.toString() || null,
      })),
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 })
  }
}

// ============================================================
// POST - BookMe webhook receiver
// ============================================================

const BookingSchema = z.object({
  bookingId: z.string(),
  eventType: z.string().optional().default('consultation'),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  scheduledDate: z.string(),
  duration: z.number(),
  meetingUrl: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().default('bookme'),
  createdAt: z.string().optional(),
})

type BookingPayload = z.infer<typeof BookingSchema>

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
      details: result.error,
    }, { status: 400 })
  }

  const booking = result.data

  try {
    // 3. Process booking in transaction
    const resultData = await processBooking(booking)

    return NextResponse.json({
      success: true,
      ...resultData,
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

    const existingContact = await tx.contact.findFirst({
      where: { email: booking.email },
    })

    const contact = existingContact
      ? await tx.contact.update({
          where: { id: existingContact.id },
          data: {
            firstName,
            lastName,
            phone: booking.phone || existingContact.phone,
            tags: {
              set: Array.from(new Set([
                ...existingContact.tags,
                'bookme',
                booking.eventType,
              ])),
            },
          },
        })
      : await tx.contact.create({
          data: {
            firstName,
            lastName,
            email: booking.email,
            phone: booking.phone,
            tags: ['bookme', booking.eventType],
          },
        })

    // 2. Find or create company (if provided)
    let companyId: string | null = null
    if (booking.company) {
      let company = await tx.company.findFirst({
        where: { name: booking.company },
      })

      if (!company) {
        company = await tx.company.create({
          data: {
            name: booking.company,
            tags: ['bookme'],
          },
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
    const leadTitle = booking.company
      ? `${booking.eventType} - ${booking.company}`
      : `${booking.eventType} - ${firstName} ${lastName}`

    const existingLead = await tx.lead.findFirst({
      where: {
        companyId: companyId,
        title: { contains: booking.eventType },
        status: 'ACTIVE',
      },
    })

    const lead = existingLead
      ? await tx.lead.update({
          where: { id: existingLead.id },
          data: {
            lastActivityDate: new Date(),
            leadScore: Math.max(existingLead.leadScore, 60),
          },
        })
      : await tx.lead.create({
          data: {
            title: leadTitle,
            description: `Booked via BookMe: ${booking.eventType}${booking.notes ? '\n\nNotes: ' + booking.notes : ''}`,
            stage: 'CONTACTED',
            status: 'ACTIVE',
            source: 'WEBSITE',
            leadScore: 50,
            contactId: contact.id,
            companyId: companyId,
            lastActivityDate: new Date(),
            nextStep: `Prepare for ${booking.eventType}`,
            nextStepDate: new Date(new Date(booking.scheduledDate).getTime() - 24 * 60 * 60 * 1000),
            tags: ['bookme', booking.eventType],
          },
        })

    // 4. Create activity
    const activity = await tx.activity.create({
      data: {
        type: 'meeting',
        description: `${booking.eventType} - Scheduled via BookMe`,
        activityDate: new Date(booking.scheduledDate),
        durationMinutes: booking.duration,
        leadId: lead.id,
        contactId: contact.id,
        metadata: {
          bookingId: booking.bookingId,
          meetingUrl: booking.meetingUrl,
          source: booking.source,
        },
      },
    })

    // 5. Create automated tasks
    const scheduledDate = new Date(booking.scheduledDate)
    const tasks = []

    // Workshop-specific tasks
    if (booking.eventType.toLowerCase().includes('workshop')) {
      // Reminder 1 day before
      tasks.push(
        await tx.task.create({
          data: {
            title: 'Send workshop reminder',
            description: 'Quick reminder email with:\n- Tomorrow\'s workshop details\n- Meeting link\n- "Looking forward to seeing you!"',
            priority: 'medium',
            status: 'todo',
            dueDate: new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000),
            leadId: lead.id,
          },
        })
      )
      // Follow-up after workshop
      tasks.push(
        await tx.task.create({
          data: {
            title: 'Workshop follow-up',
            description: 'Send thank you email with:\n- Thank you for participating\n- Key takeaways recap\n- Additional resources\n- Feedback survey link\n- Discuss next steps / continued engagement\n\nCheck: Did they seem interested in further consulting?',
            priority: 'medium',
            status: 'todo',
            dueDate: new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000),
            leadId: lead.id,
          },
        })
      )
    } else {
      // Generic consultation follow-up
      tasks.push(
        await tx.task.create({
          data: {
            title: 'Consultation follow-up',
            description: 'Follow up after consultation:\n- Send summary\n- Propose next steps\n- Share relevant resources',
            priority: 'medium',
            status: 'todo',
            dueDate: new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000),
            leadId: lead.id,
          },
        })
      )
    }

    return {
      lead: { id: lead.id, title: lead.title, stage: lead.stage },
      contact: { id: contact.id, email: contact.email, name: `${contact.firstName} ${contact.lastName}` },
      activity: { id: activity.id, scheduledDate: activity.activityDate },
      tasks: tasks.map((t) => ({ id: t.id, title: t.title, dueDate: t.dueDate })),
    }
  })
}
