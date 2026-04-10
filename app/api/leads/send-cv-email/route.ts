import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { to, subject, body, attachment } = await request.json()

  const result = await resend.emails.send({
    from: 'Mikael Feltenmark <mikael@techchange.io>',
    to,
    subject,
    html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
    attachments: attachment ? [{
      filename: attachment.filename,
      content: attachment.content,
    }] : [],
  })
  console.log('Resend result:', JSON.stringify(result))

  return NextResponse.json({ ok: true })
}
