// app/api/bookings/incoming/route.ts  (freelance-crm project)

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const BookingSchema = z.object({
  bookingId: z.string(),
  eventTypeId: z.string().optional(),
  eventTypeName: z.string().optional(),
  eventTypeSlug: z.string().optional(),
  eventType: z.string().optional(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  answers: z.array(z.object({
    question_id: z.string().optional(),
    question_label: z.string(),
    answer: z.string(),
  })).optional().default([]),
  scheduledDate: z.string(),
  duration: z.number().optional(),
  meetingUrl: z.string().nullable().optional(),
  source: z.string().default('bookme'),
  variant: z.string().nullable().optional().default(null),
  campaign: z.string().nullable().optional().default(null),
  createdAt: z.string().optional(),
})

type BookingPayload = z.infer<typeof BookingSchema>

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-webhook-secret')
    if (secret !== process.env.CRM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = BookingSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: result.error.format() },
        { status: 400 }
      )
    }

    const booking = result.data
    const resultData = await processBooking(booking)

    return NextResponse.json({ success: true, ...resultData })
  } catch (error) {
    console.error('Error processing booking webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function processBooking(booking: BookingPayload) {
  const eventTypeName = booking.eventTypeName ?? booking.eventType ?? 'Consultation'

  return await prisma.$transaction(async (tx) => {
    // 1. Find or create contact (no upsert – email is not a unique key in Prisma schema)
    let contact = await tx.contact.findFirst({ where: { email: booking.email } })
    if (!contact) {
      contact = await tx.contact.create({
        data: {
          firstName: booking.name.split(" ")[0],
          lastName: booking.name.split(" ").slice(1).join(" ") || "-",
          email: booking.email,
          phone: booking.phone ?? null,
          tags: ['bookme'],
        },
      })
    } else {
      contact = await tx.contact.update({
        where: { id: contact.id },
        data: {
          firstName: booking.name.split(" ")[0],
          lastName: booking.name.split(" ").slice(1).join(" ") || "-",
          ...(booking.phone ? { phone: booking.phone } : {}),
        },
      })
    }

    // 2. Find or create company
    let companyId: string | null = null
    if (booking.company) {
      let company = await tx.company.findFirst({ where: { name: booking.company } })
      if (!company) {
        company = await tx.company.create({
          data: { name: booking.company, tags: ['bookme'] },
        })
      }
      companyId = company.id
    }

    const sourceLabel = booking.variant
      ? booking.variant.replace(/-/g, ' ')
      : booking.source

    // 3. Create lead
    const lead = await tx.lead.create({
      data: {
        title: `${eventTypeName} – ${sourceLabel}`,
        status: 'ACTIVE',
        stage: 'CONTACTED',
        contactId: contact.id,
        companyId: companyId,
        notes: [
          booking.notes ?? '',
          `Source: ${booking.source}`,
          booking.variant ? `Variant: ${booking.variant}` : '',
          booking.campaign ? `Campaign: ${booking.campaign}` : '',
          booking.answers && booking.answers.length > 0
            ? '\nIntake answers:\n' + booking.answers.map((a) => `- ${a.question_label}: ${a.answer}`).join('\n')
            : '',
        ].filter(Boolean).join('\n'),
      },
    })

    // 4. Create activity
    const activity = await tx.activity.create({
      data: {
        leadId: lead.id,
        contactId: contact.id,
        subject: `${eventTypeName}${booking.variant ? ` (${booking.variant})` : ''}`,
        activityType: 'meeting',
        activityDate: new Date(booking.scheduledDate),
        outcome: 'positive',
        description: [
          `Booked via ${booking.source}`,
          booking.variant ? `Variant: ${booking.variant}` : '',
          booking.campaign ? `Campaign: ${booking.campaign}` : '',
          booking.meetingUrl ? `Meet: ${booking.meetingUrl}` : '',
          booking.notes ? `Notes: ${booking.notes}` : '',
        ].filter(Boolean).join('\n'),
      },
    })

    // 5. Follow-up task
    const followUpDate = new Date(booking.scheduledDate)
    followUpDate.setDate(followUpDate.getDate() + 1)
    followUpDate.setHours(9, 0, 0, 0)

    const task = await tx.task.create({
      data: {
        leadId: lead.id,
        title: `Follow-up: ${eventTypeName}`,
        description: `Send follow-up after ${eventTypeName} meeting`,
        status: 'todo',
        priority: 'high',
        dueDate: followUpDate,
      },
    })

    return { lead, contact, activity, tasks: [task] }
  })
}
