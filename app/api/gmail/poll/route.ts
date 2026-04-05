import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { prisma } from '@/lib/db'

function extractBody(payload: any): string {
  if (!payload) return ''

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64url').toString('utf-8')
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64url').toString('utf-8')
      }
    }
    for (const part of payload.parts) {
      const result = extractBody(part)
      if (result) return result
    }
  }

  return ''
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const credentials = JSON.parse(process.env.GMAIL_LEADS_SERVICE_ACCOUNT!)
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      subject: 'mikael@techchange.io',
    })

    const gmail = google.gmail({ version: 'v1', auth })

    const res = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['Label_1828285423036418760'],
      maxResults: 10,
    })

    const messages = res.data.messages || []
    let created = 0

    for (const msg of messages) {
      const existing = await prisma.mailSignal.findUnique({
        where: { gmailId: msg.id! },
      })
      if (existing) continue

      const full = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'full',
      })

      const headers = full.data.payload?.headers || []
      const from = headers.find(h => h.name === 'From')?.value || ''
      const subject = headers.find(h => h.name === 'Subject')?.value || ''
      const body = extractBody(full.data.payload) || full.data.snippet || ''

      await prisma.mailSignal.create({
        data: {
          gmailId: msg.id!,
          from,
          subject,
          body,
          status: 'pending',
        },
      })
      created++
    }

    return NextResponse.json({ processed: messages.length, created })
  } catch (error) {
    console.error('Gmail poll error:', error)
    return NextResponse.json({ error: 'Poll failed' }, { status: 500 })
  }
}
