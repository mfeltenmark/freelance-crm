import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { leadId, contactId, title, scheduledAt, durationMinutes, notes, inviteContact, contactEmail } = await request.json()

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
        ...(inviteContact && contactEmail ? {
          attendees: [{ email: contactEmail }],
        } : {}),
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
        metadata: {
          meetingUrl: event.data.htmlLink,
          googleEventId: event.data.id,
        },
      },
    })

    return NextResponse.json({ activity, event: event.data })
  } catch (error) {
    console.error('Error creating meeting:', error)
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 })
  }
}
