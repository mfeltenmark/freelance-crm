import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  // Hitta alla kontakter som har aktiviteter men ingen aktivitet senaste 14 dagarna
  const contacts = await prisma.contact.findMany({
    where: {
      leads: {
        some: {
          activities: {
            some: {}
          }
        }
      }
    },
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

    // Hitta senaste aktivitetsdatum
    const latestLead = contact.leads[0]
    if (!latestLead) continue
    const latestActivity = latestLead.activities[0]
    if (!latestActivity) continue

    const lastContact = new Date(latestActivity.activityDate)
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
