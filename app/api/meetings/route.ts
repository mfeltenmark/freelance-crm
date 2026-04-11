import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { leadId, contactId, title, scheduledAt, durationMinutes, notes } = await request.json()

    console.log('meetings POST called', { leadId, title, scheduledAt })

    if (!scheduledAt || !title) {
      return NextResponse.json({ error: 'title and scheduledAt are required' }, { status: 400 })
    }

    const credentials = JSON.parse(process.env.GMAIL_LEADS_SERVICE_ACCOUNT!)
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/calendar',
      ],
      subject: 'mikael@techchange.io',
    })

    const calendar = google.calendar({ version: 'v3', auth })

    const startTime = new Date(scheduledAt)
    const endTime = new Date(startTime.getTime() + (durationMinutes || 30) * 60 * 1000)

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: title,
        description: notes || '',
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'Europe/Stockholm',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'Europe/Stockholm',
        },
      },
    })

    const meetingUrl = event.data.htmlLink || undefined

    const activity = await prisma.activity.create({
      data: {
        type: 'MEETING',
        subject: title,
        description: notes || `Möte bokat: ${title}`,
        activityDate: startTime,
        durationMinutes: durationMinutes || 30,
        leadId: leadId || null,
        contactId: contactId || null,
        metadata: meetingUrl ? { meetingUrl } : undefined,
      },
    })

    return NextResponse.json({ activity, event: event.data })
  } catch (error) {
    console.error('Error creating meeting:', error)
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 })
  }
}
