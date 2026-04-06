import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leadId } = await params
  const { to, subject, message } = await request.json()

  await resend.emails.send({
    from: 'Mikael Feltenmark <mikael@techchange.io>',
    to,
    subject,
    text: message,
  })

  await prisma.activity.create({
    data: {
      leadId,
      type: 'EMAIL_SENT',
      description: `Kompletteringsmail skickat till ${to}: ${subject}`,
    },
  })

  const threeDaysFromNow = new Date()
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

  await prisma.task.create({
    data: {
      leadId,
      title: 'Följ upp komplettering',
      dueDate: threeDaysFromNow,
      priority: 'MEDIUM',
    },
  })

  return NextResponse.json({ success: true })
}
