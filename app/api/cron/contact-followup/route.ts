import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  // Hämta leads med status CONTACT som inte haft aktivitet på 14 dagar
  const leads = await prisma.lead.findMany({
    where: {
      status: 'CONTACT',
      OR: [
        { lastActivityDate: { lt: fourteenDaysAgo } },
        { lastActivityDate: null },
      ],
    },
    include: {
      tasks: {
        where: {
          status: { in: ['todo', 'in_progress'] },
          title: { contains: 'Följ upp' },
        },
      },
      contact: {
        select: { firstName: true, lastName: true },
      },
    },
  })

  let created = 0

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 2)

  for (const lead of leads) {
    // Hoppa över om det redan finns en öppen uppföljnings-task på leaden
    if (lead.tasks.length > 0) continue

    try {
      await prisma.task.create({
        data: {
          leadId: lead.id,
          title: 'Följ upp kontakt',
          description: lead.contact
            ? `Följ upp med ${lead.contact.firstName} ${lead.contact.lastName} gällande "${lead.title}".`
            : `Följ upp kontakt gällande "${lead.title}".`,
          priority: 'medium',
          dueDate,
          status: 'todo',
        },
      })
      created++
    } catch (err) {
      console.error('Failed to create followup task for lead:', lead.id, err)
    }
  }

  return NextResponse.json({ ok: true, created })
}
