import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { findTranscriptForMeeting, readTranscriptFromDoc } from '@/lib/google-drive'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  console.log('Poll started, now:', now.toISOString())

  const leads = await prisma.lead.findMany({
    where: {
      meetingUrl: { not: null },
      transcript: null,
      AND: [
        { scheduledAt: { not: null } },
        { scheduledAt: { lt: new Date(now.getTime() - 30 * 60 * 1000) } },
      ],
    },
    select: { id: true, scheduledAt: true, durationMinutes: true },
  })
  console.log('Leads found:', JSON.stringify(leads))

  const eligibleLeads = leads.filter(lead => {
    const endTime = new Date(
      lead.scheduledAt!.getTime() + (lead.durationMinutes ?? 60) * 60 * 1000 + 30 * 60 * 1000
    )
    return now > endTime
  })
  console.log('Eligible leads:', JSON.stringify(eligibleLeads))

  const results = { processed: 0, found: 0, errors: 0 }

  for (const lead of eligibleLeads) {
    try {
      results.processed++
      const fileId = await findTranscriptForMeeting(lead.scheduledAt!)
      if (!fileId) continue

      const rawText = await readTranscriptFromDoc(fileId)
      if (!rawText) continue

      await prisma.transcript.create({
        data: {
          leadId: lead.id,
          rawText,
          status: 'pending',
        },
      })
      results.found++
    } catch (err) {
      console.error(`Transcript poll error for lead ${lead.id}:`, err)
      results.errors++
    }
  }

  return NextResponse.json(results)
}
