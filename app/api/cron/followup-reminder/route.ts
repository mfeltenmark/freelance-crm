import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  // Hämta ALLA kontakter
  const contacts = await prisma.contact.findMany({
    include: {
      leads: {
        include: {
          activities: {
            orderBy: { activityDate: 'desc' },
            take: 1
          }
        },
        orderBy: { lastActivityDate: 'desc' },
        take: 1
      },
      tasks: {
        where: {
          status: { in: ['todo', 'in_progress'] },
          title: { contains: 'Följ upp' }
        }
      }
    }
  })

  let created = 0

  for (const contact of contacts) {
    // Hoppa över om det redan finns en öppen uppföljnings-task
    if (contact.tasks.length > 0) continue

    // Bestäm senaste kontaktdatum: senaste aktivitet på lead, eller createdAt som fallback
    const latestLeadActivity = contact.leads[0]?.activities[0]
    const latestActivityDate = latestLeadActivity
      ? new Date(latestLeadActivity.activityDate)
      : new Date(contact.createdAt)

    const lastContact = latestActivityDate
    if (lastContact > fourteenDaysAgo) continue

    const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(' ')

    console.log('Processing contact:', contact.id, contactName)

    try {
      await prisma.task.create({
        data: {
          contactId: contact.id,
          title: `Följ upp med ${contactName}`,
          description: `Senaste kontakt: ${lastContact.toLocaleDateString('sv-SE')}. Dags att höra av dig igen.`,
          priority: 'medium',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dagar framåt
          status: 'todo',
        }
      })
      created++
    } catch (err) {
      console.error('Failed to create task for contact:', contact.id, err)
    }
  }

  return NextResponse.json({ ok: true, created })
}
