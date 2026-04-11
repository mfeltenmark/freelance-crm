import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { title, scheduledAt, durationMinutes, notes } = await request.json()

  const activity = await prisma.activity.findUnique({ where: { id: params.id } })
  if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const metadata = activity.metadata as any
  const googleEventId = metadata?.googleEventId

  const startTime = new Date(scheduledAt)
  const endTime = new Date(startTime.getTime() + (durationMinutes || 30) * 60000)

  if (googleEventId) {
    const credentials = JSON.parse(process.env.GMAIL_LEADS_SERVICE_ACCOUNT!)
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar'],
      subject: 'mikael@techchange.io',
    })
    const calendar = google.calendar({ version: 'v3', auth })
    await calendar.events.patch({
      calendarId: 'primary',
      eventId: googleEventId,
      requestBody: {
        summary: title,
        description: notes || '',
        start: { dateTime: startTime.toISOString(), timeZone: 'Europe/Stockholm' },
        end: { dateTime: endTime.toISOString(), timeZone: 'Europe/Stockholm' },
      },
    })
  }

  const updated = await prisma.activity.update({
    where: { id: params.id },
    data: {
      subject: title,
      description: notes || '',
      activityDate: startTime,
      durationMinutes: durationMinutes || 30,
    },
  })

  return NextResponse.json({ activity: updated })
}
