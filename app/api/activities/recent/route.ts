import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: {
      lead: {
        select: { id: true, title: true },
      },
      contact: {
        select: { firstName: true, lastName: true },
      },
    },
  })

  const mapped = activities.map((a) => ({
    id: a.id,
    type: mapType(a.type),
    description: buildDescription(a),
    leadTitle: a.lead?.title || undefined,
    leadId: a.lead?.id || undefined,
    createdAt: a.createdAt.toISOString(),
  }))

  return NextResponse.json({ activities: mapped })
}

function mapType(type: string) {
  const map: Record<string, string> = {
    EMAIL_SENT: 'email',
    EMAIL_RECEIVED: 'email',
    CALL: 'call',
    MEETING: 'meeting',
    NOTE: 'note',
    TASK: 'task_completed',
  }
  return map[type] || 'note'
}

function buildDescription(a: any): string {
  const contactName = a.contact
    ? `${a.contact.firstName} ${a.contact.lastName}`.trim()
    : null

  switch (a.type) {
    case 'MEETING':
      return contactName ? `Möte bokat med ${contactName}` : a.subject || 'Möte bokat'
    case 'EMAIL_SENT':
      return contactName ? `Email skickad till ${contactName}` : a.subject || 'Email skickad'
    case 'EMAIL_RECEIVED':
      return contactName ? `Email mottagen från ${contactName}` : a.subject || 'Email mottagen'
    case 'CALL':
      return contactName ? `Samtal med ${contactName}` : a.subject || 'Samtal'
    case 'NOTE':
      return a.subject || 'Anteckning tillagd'
    case 'TASK':
      return a.subject || 'Task slutförd'
    default:
      return a.subject || 'Aktivitet'
  }
}
